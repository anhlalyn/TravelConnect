const cors = require('cors')
const dotenv = require('dotenv')
const express = require('express')
const http = require('http')
const path = require('path')
const socketIo = require('socket.io')
const { initIO } = require('./src/socket')
const { ensureDefaultAdmin } = require('./src/utils/bootstrapAdmin')

dotenv.config()

const app = express()
const server = http.createServer(app)
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'

const io = socketIo(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
})

initIO(io)

const allRoutes = require('./src/routes/index')

const liveStreams = new Map()

const getSerializedStreams = () =>
  Array.from(liveStreams.values()).map((stream) => ({
    streamId: stream.streamId,
    title: stream.title,
    hostId: stream.hostId,
    hostName: stream.hostName,
    startedAt: stream.startedAt,
    viewerCount: stream.viewers.size,
  }))

const broadcastLiveStreams = () => {
  io.emit('live:list', getSerializedStreams())
}

app.use(cors())
app.use(express.json())
app.use('/api', allRoutes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-room', (roomId) => {
    if (!roomId) return
    socket.join(roomId)
    console.log(`User ${socket.id} joined room ${roomId}`)
  })

  socket.on('leave-room', (roomId) => {
    if (!roomId) return
    socket.leave(roomId)
  })

  socket.on('call-user', (data) => {
    socket.to(data.to).emit('incoming-call', data)
  })

  socket.on('answer-call', (data) => {
    socket.to(data.to).emit('call-answered', data)
  })

  socket.on('ice-candidate', (data) => {
    socket.to(data.to).emit('ice-candidate', data)
  })

  socket.on('end-call', (data) => {
    socket.to(data.to).emit('call-ended', data)
  })

  socket.on('live:get-list', () => {
    socket.emit('live:list', getSerializedStreams())
  })

  socket.on('live:start', (data) => {
    if (!data?.streamId) return

    liveStreams.set(data.streamId, {
      streamId: data.streamId,
      title: data.title || 'Live Stream',
      hostId: data.hostId,
      hostName: data.hostName || 'Streamer',
      hostSocketId: socket.id,
      startedAt: data.startedAt || new Date().toISOString(),
      viewers: new Set(),
    })

    socket.data.hostedStreamId = data.streamId
    socket.join(`live_host_${data.streamId}`)
    broadcastLiveStreams()
  })

  socket.on('live:join', (data) => {
    const stream = liveStreams.get(data?.streamId)
    if (!stream) {
      socket.emit('live:error', { message: 'Livestream không còn hoạt động' })
      return
    }

    stream.viewers.add(socket.id)
    socket.data.watchingStreamId = data.streamId
    socket.join(`live_viewers_${data.streamId}`)

    io.to(stream.hostSocketId).emit('live:viewer-joined', {
      streamId: data.streamId,
      viewerSocketId: socket.id,
      viewerId: data.viewerId,
      viewerName: data.viewerName,
    })

    broadcastLiveStreams()
  })

  socket.on('live:leave', (data) => {
    const stream = liveStreams.get(data?.streamId)
    if (!stream) return

    stream.viewers.delete(socket.id)
    socket.leave(`live_viewers_${data.streamId}`)
    io.to(stream.hostSocketId).emit('live:viewer-left', {
      streamId: data.streamId,
      viewerSocketId: socket.id,
    })
    delete socket.data.watchingStreamId
    broadcastLiveStreams()
  })

  socket.on('live:offer', (data) => {
    if (!data?.toSocketId) return
    io.to(data.toSocketId).emit('live:offer', {
      ...data,
      fromSocketId: socket.id,
    })
  })

  socket.on('live:answer', (data) => {
    if (!data?.toSocketId) return
    io.to(data.toSocketId).emit('live:answer', {
      ...data,
      fromSocketId: socket.id,
    })
  })

  socket.on('live:ice-candidate', (data) => {
    if (!data?.toSocketId) return
    io.to(data.toSocketId).emit('live:ice-candidate', {
      ...data,
      fromSocketId: socket.id,
    })
  })

  socket.on('live:end', (data) => {
    const stream = liveStreams.get(data?.streamId)
    if (!stream) return

    io.to(`live_viewers_${data.streamId}`).emit('live:ended', {
      streamId: data.streamId,
    })

    liveStreams.delete(data.streamId)
    delete socket.data.hostedStreamId
    broadcastLiveStreams()
  })

  socket.on('disconnect', () => {
    if (socket.data?.hostedStreamId) {
      const hostedStreamId = socket.data.hostedStreamId
      io.to(`live_viewers_${hostedStreamId}`).emit('live:ended', {
        streamId: hostedStreamId,
      })
      liveStreams.delete(hostedStreamId)
      broadcastLiveStreams()
    }

    if (socket.data?.watchingStreamId) {
      const watchingStream = liveStreams.get(socket.data.watchingStreamId)
      if (watchingStream) {
        watchingStream.viewers.delete(socket.id)
        io.to(watchingStream.hostSocketId).emit('live:viewer-left', {
          streamId: socket.data.watchingStreamId,
          viewerSocketId: socket.id,
        })
        broadcastLiveStreams()
      }
    }

    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    const adminInfo = await ensureDefaultAdmin()

    server.listen(PORT, () => {
      console.log(`Server đang chạy tại port ${PORT}`)

      if (adminInfo.created) {
        console.log('Đã tạo tài khoản admin mặc định:')
        console.log(`Email: ${adminInfo.email}`)
        console.log(`Mật khẩu: ${adminInfo.password}`)
      } else if (adminInfo.email) {
        console.log(`Admin hiện có: ${adminInfo.email}`)
      }
    })
  } catch (error) {
    console.error('Không thể khởi động server:', error.message)
    process.exit(1)
  }
}

startServer()
