import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  Mic,
  MicOff,
  PlayCircle,
  Radio,
  Square,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { SOCKET_URL } from "../config";

const createPeerConnection = (onIceCandidate, onTrack) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  });

  peerConnection.onicecandidate = onIceCandidate;
  peerConnection.ontrack = onTrack;

  return peerConnection;
};

const LiveStream = ({ user }) => {
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const hostPeerConnectionsRef = useRef(new Map());
  const viewerPeerConnectionRef = useRef(null);
  const hostingStreamIdRef = useRef(null);
  const watchingStreamRef = useRef(null);

  const [streamTitle, setStreamTitle] = useState("");
  const [activeStreams, setActiveStreams] = useState([]);
  const [hostingStreamId, setHostingStreamId] = useState(null);
  const [watchingStream, setWatchingStream] = useState(null);
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [isPreparingCamera, setIsPreparingCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  const currentHostedStream = useMemo(
    () => activeStreams.find((stream) => stream.streamId === hostingStreamId) || null,
    [activeStreams, hostingStreamId],
  );

  useEffect(() => {
    hostingStreamIdRef.current = hostingStreamId;
  }, [hostingStreamId]);

  useEffect(() => {
    watchingStreamRef.current = watchingStream;
  }, [watchingStream]);

  const attachLocalPreview = (stream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current
        .play()
        .catch(() => {});
    }
  };

  const stopLocalPreview = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setCameraReady(false);
  };

  const ensureLocalPreview = async ({ showError = true } = {}) => {
    if (localStreamRef.current) {
      attachLocalPreview(localStreamRef.current);
      setCameraReady(true);
      setCameraError("");
      return localStreamRef.current;
    }

    try {
      setIsPreparingCamera(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });

      localStreamRef.current = mediaStream;
      attachLocalPreview(mediaStream);
      setCameraReady(true);
      setCameraError("");
      return mediaStream;
    } catch (err) {
      console.error(err);
      setCameraReady(false);
      setCameraError("Không thể truy cập camera hoặc micro.");
      if (showError) {
        toast.error("Không thể bật camera livestream.");
      }
      return null;
    } finally {
      setIsPreparingCamera(false);
    }
  };

  useEffect(() => {
    const socket = io(SOCKET_URL);
    const hostPeerConnections = hostPeerConnectionsRef.current;
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("live:get-list");
    });

    socket.on("live:list", (streams) => {
      setActiveStreams(streams || []);
    });

    socket.on("live:error", (data) => {
      toast.error(data?.message || "Không thể xử lý livestream.");
    });

    socket.on("live:viewer-joined", async ({ viewerSocketId, streamId }) => {
      if (!localStreamRef.current || streamId !== hostingStreamIdRef.current) return;

      const peerConnection = createPeerConnection(
        (event) => {
          if (!event.candidate) return;
          socket.emit("live:ice-candidate", {
            streamId,
            toSocketId: viewerSocketId,
            candidate: event.candidate,
          });
        },
        () => {},
      );

      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });

      hostPeerConnectionsRef.current.set(viewerSocketId, peerConnection);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socket.emit("live:offer", {
        streamId,
        toSocketId: viewerSocketId,
        sdp: offer,
      });
    });

    socket.on("live:viewer-left", ({ viewerSocketId, streamId }) => {
      if (streamId !== hostingStreamIdRef.current) return;

      const peerConnection = hostPeerConnectionsRef.current.get(viewerSocketId);
      if (peerConnection) {
        peerConnection.close();
        hostPeerConnectionsRef.current.delete(viewerSocketId);
      }
    });

    socket.on("live:offer", async ({ streamId, fromSocketId, sdp }) => {
      if (!watchingStreamRef.current || watchingStreamRef.current.streamId !== streamId) return;

      const peerConnection = createPeerConnection(
        (event) => {
          if (!event.candidate) return;
          socket.emit("live:ice-candidate", {
            streamId,
            toSocketId: fromSocketId,
            candidate: event.candidate,
          });
        },
        (event) => {
          const [remoteStream] = event.streams;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        },
      );

      viewerPeerConnectionRef.current = peerConnection;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit("live:answer", {
        streamId,
        toSocketId: fromSocketId,
        sdp: answer,
      });
    });

    socket.on("live:answer", async ({ fromSocketId, sdp }) => {
      const peerConnection = hostPeerConnectionsRef.current.get(fromSocketId);
      if (!peerConnection) return;
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("live:ice-candidate", async ({ fromSocketId, candidate }) => {
      const peerConnection =
        hostPeerConnectionsRef.current.get(fromSocketId) || viewerPeerConnectionRef.current;

      if (!peerConnection || !candidate) return;

      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("live:ended", ({ streamId }) => {
      if (watchingStreamRef.current?.streamId === streamId) {
        viewerPeerConnectionRef.current?.close();
        viewerPeerConnectionRef.current = null;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setWatchingStream(null);
        toast("Livestream đã kết thúc", { icon: "📺" });
      }
    });

    return () => {
      socket.disconnect();
      hostPeerConnections.forEach((peerConnection) => peerConnection.close());
      hostPeerConnections.clear();
      viewerPeerConnectionRef.current?.close();
      stopLocalPreview();
    };
  }, []);

  useEffect(() => {
    setViewerCount(currentHostedStream?.viewerCount || 0);
  }, [currentHostedStream]);

  useEffect(() => {
    if (watchingStream) return;
    ensureLocalPreview({ showError: false });
  }, [watchingStream]);

  useEffect(() => {
    if (!localStreamRef.current) return;

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !isVideoOff;
    });
  }, [isMuted, isVideoOff]);

  const startLiveStream = async () => {
    try {
      setIsStartingStream(true);
      const mediaStream = await ensureLocalPreview();
      if (!mediaStream) return;

      const streamId = `live-${user.id}-${Date.now()}`;
      socketRef.current.emit("live:start", {
        streamId,
        title: streamTitle.trim() || `${user.ten} đang livestream`,
        hostId: user.id,
        hostName: user.ten,
        startedAt: new Date().toISOString(),
      });

      setHostingStreamId(streamId);
      setViewerCount(0);
      toast.success("Đã bắt đầu livestream.");
    } catch (err) {
      console.error(err);
      toast.error("Không thể bắt đầu livestream.");
    } finally {
      setIsStartingStream(false);
    }
  };

  const stopLiveStream = () => {
    if (!hostingStreamId) return;

    socketRef.current.emit("live:end", { streamId: hostingStreamId });
    hostPeerConnectionsRef.current.forEach((peerConnection) => peerConnection.close());
    hostPeerConnectionsRef.current.clear();

    setHostingStreamId(null);
    setViewerCount(0);
    setIsMuted(false);
    setIsVideoOff(false);

    if (localStreamRef.current) {
      attachLocalPreview(localStreamRef.current);
    }
  };

  const joinLiveStream = (stream) => {
    if (hostingStreamId) {
      toast.error("Bạn đang là người phát live.");
      return;
    }

    if (watchingStream?.streamId === stream.streamId) return;

    viewerPeerConnectionRef.current?.close();
    viewerPeerConnectionRef.current = null;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setWatchingStream(stream);
    socketRef.current.emit("live:join", {
      streamId: stream.streamId,
      viewerId: user.id,
      viewerName: user.ten,
    });
  };

  const leaveLiveStream = () => {
    if (!watchingStream) return;

    socketRef.current.emit("live:leave", {
      streamId: watchingStream.streamId,
    });
    viewerPeerConnectionRef.current?.close();
    viewerPeerConnectionRef.current = null;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setWatchingStream(null);
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    setIsMuted((current) => !current);
  };

  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    setIsVideoOff((current) => !current);
  };

  const streamHeading = hostingStreamId
    ? streamTitle.trim() || `${user.ten} đang livestream`
    : watchingStream?.title || "Camera xem trước";

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 pb-10 pt-6">
        <div className="col-span-3 hidden lg:block">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-9">
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-3xl font-black text-slate-900">Live Stream</h1>
            <p className="text-sm text-slate-500">
              Phát trực tiếp hành trình, hoạt động tại khu du lịch hoặc xem các live đang diễn ra theo thời gian thực.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4 rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Khung phát
                  </p>
                  <h2 className="mt-2 text-xl font-black text-slate-800">{streamHeading}</h2>
                </div>

                {hostingStreamId && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-600">
                    <Radio size={14} />
                    Live
                  </div>
                )}
              </div>

              <div className="relative aspect-video overflow-hidden rounded-[2rem] bg-slate-900">
                {hostingStreamId ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : watchingStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : cameraReady ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center text-slate-400">
                    <PlayCircle size={42} className="mb-4 text-slate-500" />
                    <p className="font-black text-white">
                      {isPreparingCamera ? "Đang bật camera..." : "Camera chưa sẵn sàng"}
                    </p>
                    {cameraError && <p className="mt-2 text-sm text-slate-300">{cameraError}</p>}
                  </div>
                )}

                {(hostingStreamId || cameraReady) && !watchingStream && (
                  <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                    <Users size={14} />
                    {hostingStreamId ? `${viewerCount} người xem` : "Camera sẵn sàng"}
                  </div>
                )}
              </div>

              {hostingStreamId ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition-colors ${
                      isMuted
                        ? "bg-red-50 text-red-600"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                      {isMuted ? "Bật mic" : "Tắt mic"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleVideo}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition-colors ${
                      isVideoOff
                        ? "bg-red-50 text-red-600"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                      {isVideoOff ? "Bật camera" : "Tắt camera"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={stopLiveStream}
                    className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-red-700"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Square size={16} />
                      Kết thúc live
                    </span>
                  </button>
                </div>
              ) : watchingStream ? (
                <button
                  type="button"
                  onClick={leaveLiveStream}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-700"
                >
                  Rời livestream
                </button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => ensureLocalPreview()}
                    disabled={isPreparingCamera}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
                  >
                    {isPreparingCamera ? "Đang bật camera..." : "Bật xem trước camera"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-4 rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Phát trực tiếp
                </p>

                <input
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="Tiêu đề livestream"
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-blue-300"
                  disabled={Boolean(hostingStreamId)}
                />

                <button
                  type="button"
                  onClick={startLiveStream}
                  disabled={Boolean(hostingStreamId) || isStartingStream || isPreparingCamera}
                  className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
                >
                  {isStartingStream ? "Đang khởi tạo..." : "Bắt đầu livestream"}
                </button>

                <p className="text-xs leading-relaxed text-slate-500">
                  Camera được hiển thị sẵn để bạn kiểm tra góc quay trước khi phát.
                </p>
              </div>

              <div className="rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Đang phát
                    </p>
                    <h2 className="mt-2 text-lg font-black text-slate-800">
                      {activeStreams.length} livestream
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => socketRef.current?.emit("live:get-list")}
                    className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200"
                  >
                    Làm mới
                  </button>
                </div>

                <div className="space-y-3">
                  {activeStreams.length > 0 ? (
                    activeStreams.map((stream) => (
                      <div
                        key={stream.streamId}
                        className="rounded-[1.8rem] border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate font-black text-slate-800">{stream.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {stream.hostName} • {stream.viewerCount} người xem
                            </p>
                          </div>

                          {stream.hostId === user.id ? (
                            <span className="rounded-full bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700">
                              Của bạn
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => joinLiveStream(stream)}
                              className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-blue-600"
                            >
                              <span className="inline-flex items-center gap-2">
                                <Eye size={14} />
                                Xem
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[2rem] border border-dashed border-slate-200 p-8 text-center text-slate-400">
                      Chưa có livestream nào đang diễn ra.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
