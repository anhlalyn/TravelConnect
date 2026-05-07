import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import {
  Image as ImageIcon,
  MessageSquare,
  Mic,
  MicOff,
  MoreVertical,
  Phone,
  PhoneOff,
  Plus,
  Send,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { SOCKET_URL, buildUploadUrl } from "../config";

const appendUniqueMessage = (currentMessages, incomingMessage) => {
  if (!incomingMessage?.id) return currentMessages;
  if (currentMessages.some((item) => item.id === incomingMessage.id))
    return currentMessages;
  return [...currentMessages, incomingMessage];
};

const formatLastMessage = (room) => {
  if (!room?.tin_nhan_cuoi) return "Bắt đầu trò chuyện...";
  if (room.loai_tin_nhan_cuoi === "image") return "Đã gửi một hình ảnh";
  if (room.loai_tin_nhan_cuoi === "audio") return "Đã gửi một tin nhắn thoại";
  return room.tin_nhan_cuoi;
};

const Messages = () => {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);

  const socketRef = useRef(null);
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activeRoomIdRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) || null,
    [activeRoomId, rooms],
  );

  const fetchRooms = useCallback(async () => {
    const res = await api.get("/messages/rooms");
    setRooms(res.data.data || []);
    return res.data.data || [];
  }, []);

  const fetchFriends = useCallback(async () => {
    const res = await api.get("/friends/list");
    setFriends(res.data.data || []);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const res = await api.get("/auth/profile");
    setUser(res.data.data);
    return res.data.data;
  }, []);

  const fetchMessages = useCallback(async (roomId) => {
    const res = await api.get(`/messages/room/${roomId}`);
    setMessages(res.data.data || []);
  }, []);

  const openRoom = useCallback(
    async (roomId) => {
      setActiveRoomId(roomId);
      await fetchMessages(roomId);
    },
    [fetchMessages],
  );

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  const handleStartChatWithFriend = useCallback(
    async (friendId) => {
      try {
        const res = await api.post("/messages/create-room", {
          id_doi_phuong: friendId,
        });
        const updatedRooms = await fetchRooms();
        const roomId = res.data.roomId;
        if (updatedRooms.some((room) => room.id === roomId)) {
          await openRoom(roomId);
        }
      } catch {
        toast.error("Không thể mở cuộc trò chuyện");
      }
    },
    [fetchRooms, openRoom],
  );

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const [currentUser, loadedRooms] = await Promise.all([
          fetchCurrentUser(),
          fetchRooms(),
          fetchFriends(),
        ]);

        const targetUserId = Number(searchParams.get("to"));
        if (Number.isInteger(targetUserId) && targetUserId > 0) {
          const res = await api.post("/messages/create-room", {
            id_doi_phuong: targetUserId,
          });
          await fetchRooms();
          await openRoom(res.data.roomId);
          return;
        }

        if (loadedRooms.length > 0) {
          await openRoom(loadedRooms[0].id);
        }

        if (currentUser?.id && !socketRef.current) {
          socketRef.current = io(SOCKET_URL);
          socketRef.current.emit("join-room", `user_${currentUser.id}`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải dữ liệu tin nhắn");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [fetchCurrentUser, fetchFriends, fetchRooms, openRoom, searchParams]);

  useEffect(() => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleNewMessage = (incomingMessage) => {
      if (
        Number(incomingMessage.id_phong) === Number(activeRoomIdRef.current)
      ) {
        setMessages((currentMessages) =>
          appendUniqueMessage(currentMessages, incomingMessage),
        );
      }
    };

    const handleRoomsRefresh = async () => {
      try {
        await fetchRooms();
      } catch (err) {
        console.error(err);
      }
    };

    const initializeWebRTC = async () => {
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && socketRef.current && activeRoom?.id_doi_phuong) {
          socketRef.current.emit("ice-candidate", {
            to: `user_${activeRoom.id_doi_phuong}`,
            candidate: event.candidate,
          });
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      return peerConnectionRef.current;
    };

    socket.on("message:new", handleNewMessage);
    socket.on("rooms:refresh", handleRoomsRefresh);

    socket.on("incoming-call", async (data) => {
      const accepted = window.confirm(
        `Cuộc gọi ${data.callType === "video" ? "gọi video" : "thoại"} từ ${data.fromName || "người dùng"}`,
      );

      if (!accepted) {
        socket.emit("end-call", { to: data.from });
        return;
      }

      try {
        const peerConnection = await initializeWebRTC();
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: data.callType === "video",
        });
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("answer-call", {
          to: data.from,
          answer,
        });

        setIsInCall(true);
        setCallType(data.callType);
      } catch (err) {
        console.error(err);
        toast.error("Không thể chấp nhận cuộc gọi");
      }
    });

    socket.on("call-answered", async (data) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer),
          );
          toast.success("Cuộc gọi đã được kết nối");
        }
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("ice-candidate", async (data) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate),
          );
        }
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("call-ended", () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      setIsInCall(false);
      setCallType(null);
      setIsMuted(false);
      setIsVideoOff(false);
      setLocalStream(null);
      setRemoteStream(null);
      toast("Cuộc gọi đã kết thúc", { icon: "📞" });
    });

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("rooms:refresh", handleRoomsRefresh);
      socket.off("incoming-call");
      socket.off("call-answered");
      socket.off("ice-candidate");
      socket.off("call-ended");
    };
  }, [activeRoom, fetchRooms, localStream, remoteStream]);

  useEffect(() => {
    if (!socketRef.current || !activeRoomId) return undefined;

    const roomName = `chat_room_${activeRoomId}`;
    socketRef.current.emit("join-room", roomName);

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", roomName);
      }
    };
  }, [activeRoomId]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleSendTextMessage = async (e) => {
    e.preventDefault();
    if (!activeRoom || !inputText.trim()) return;

    try {
      const res = await api.post("/messages/send", {
        id_phong: activeRoom.id,
        noi_dung: inputText.trim(),
      });
      setMessages((currentMessages) =>
        appendUniqueMessage(currentMessages, res.data.data),
      );
      setInputText("");
    } catch (err) {
      console.error(err);
      toast.error("Không thể gửi tin nhắn");
    }
  };

  const sendMediaFile = async (file) => {
    if (!activeRoom || !file) return;

    try {
      setSendingMedia(true);
      const formData = new FormData();
      formData.append("id_phong", activeRoom.id);
      formData.append("tep_tin", file);

      const res = await api.post("/messages/send-media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessages((currentMessages) =>
        appendUniqueMessage(currentMessages, res.data.data),
      );
    } catch (err) {
      console.error(err);
      toast.error("Không thể gửi tệp đính kèm");
    } finally {
      setSendingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await sendMediaFile(file);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      recorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const audioExtension = audioBlob.type.includes("ogg") ? "ogg" : "webm";
        const audioFile = new File(
          [audioBlob],
          `voice-message.${audioExtension}`,
          {
            type: audioBlob.type || "audio/webm",
          },
        );

        stream.getTracks().forEach((track) => track.stop());
        await sendMediaFile(audioFile);
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast.error("Không thể ghi âm trên thiết bị này");
    }
  };

  const handleToggleMember = (memberId) => {
    setSelectedMembers((currentMembers) =>
      currentMembers.includes(memberId)
        ? currentMembers.filter((id) => id !== memberId)
        : [...currentMembers, memberId],
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    try {
      setCreatingGroup(true);
      const res = await api.post("/messages/create-group", {
        ten_nhom_chat: groupName,
        thanh_vien_ids: selectedMembers,
      });

      await fetchRooms();
      await openRoom(res.data.roomId);
      setGroupName("");
      setSelectedMembers([]);
      setShowCreateGroup(false);
      toast.success("Đã tạo nhóm chat");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể tạo nhóm chat");
    } finally {
      setCreatingGroup(false);
    }
  };

  const startCall = async (type) => {
    if (!activeRoom?.id_doi_phuong) {
      toast.error("Chỉ hỗ trợ gọi trong cuộc trò chuyện cá nhân");
      return;
    }

    if (!socketRef.current || !user?.id) {
      toast.error("Kết nối chưa sẵn sàng");
      return;
    }

    try {
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("ice-candidate", {
            to: `user_${activeRoom.id_doi_phuong}`,
            candidate: event.candidate,
          });
        }
      };

      peerConnectionRef.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      socketRef.current.emit("call-user", {
        to: `user_${activeRoom.id_doi_phuong}`,
        from: `user_${user.id}`,
        fromName: user.ten,
        offer,
        callType: type,
      });

      setCallType(type);
      setIsInCall(true);
    } catch (err) {
      console.error(err);
      toast.error("Không thể bắt đầu cuộc gọi");
    }
  };

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socketRef.current && activeRoom?.id_doi_phuong) {
      socketRef.current.emit("end-call", {
        to: `user_${activeRoom.id_doi_phuong}`,
      });
    }

    setIsInCall(false);
    setCallType(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setLocalStream(null);
    setRemoteStream(null);
  }, [activeRoom?.id_doi_phuong, localStream, remoteStream]);

  const toggleMute = () => {
    if (!localStream) return;

    localStream.getAudioTracks().forEach((track) => {
      track.enabled = isMuted;
    });
    setIsMuted((current) => !current);
  };

  const toggleVideo = () => {
    if (!localStream) return;

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = isVideoOff;
    });
    setIsVideoOff((current) => !current);
  };

  const renderMessageContent = (message) => {
    if (message.loai_tin_nhan === "image") {
      return (
        <img
          src={buildUploadUrl(message.noi_dung)}
          alt="Tin nhắn hình ảnh"
          className="max-w-full rounded-2xl object-cover"
        />
      );
    }

    if (message.loai_tin_nhan === "audio") {
      return (
        <audio controls className="max-w-full">
          <source src={buildUploadUrl(message.noi_dung)} />
        </audio>
      );
    }

    return (
      <p className="leading-relaxed whitespace-pre-wrap">{message.noi_dung}</p>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-slate-600">
            Đang tải tin nhắn...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 pt-6 px-4 pb-10">
        <div className="hidden lg:block col-span-3">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 lg:col-span-9 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex overflow-hidden h-[82vh]">
          <div className="w-full md:w-80 border-r border-gray-100 flex flex-col bg-white">
            <div className="p-5 border-b border-gray-50 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-800">Tin nhắn</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(true)}
                  className="p-2.5 bg-blue-600 text-white rounded-2xl hover:bg-slate-900 transition-colors"
                  title="Tạo nhóm chat"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => handleStartChatWithFriend(friend.id)}
                    className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
                  >
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm group-hover:border-blue-500 transition-all uppercase">
                      {friend.anh_dai_dien ? (
                        <img
                          src={buildUploadUrl(friend.anh_dai_dien)}
                          alt={friend.ten}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        friend.ten?.charAt(0)
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 w-12 truncate text-center">
                      {friend.ten}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <p className="px-5 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Hội thoại
              </p>

              {rooms.map((room) => {
                const isActive = activeRoom?.id === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => openRoom(room.id)}
                    className={`p-4 mx-2 rounded-2xl flex items-center gap-3 cursor-pointer transition-all mb-1 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                        : "hover:bg-gray-50 text-slate-800"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center font-bold shrink-0 uppercase ${
                        isActive
                          ? "bg-white/20"
                          : "bg-indigo-100 text-indigo-600"
                      }`}
                    >
                      {room.loai_phong === "nhom" ? (
                        <Users size={18} />
                      ) : room.avatar ? (
                        <img
                          src={buildUploadUrl(room.avatar)}
                          alt={room.ten_hien_thi}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        room.ten_hien_thi?.charAt(0)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center mb-0.5 gap-2">
                        <p className="font-bold text-sm truncate">
                          {room.ten_hien_thi}
                        </p>
                        {room.loai_phong === "nhom" && (
                          <span className="text-[9px] font-black uppercase opacity-70">
                            {room.so_thanh_vien} người
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs truncate ${
                          isActive ? "text-white/80" : "text-gray-500"
                        }`}
                      >
                        {formatLastMessage(room)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-slate-50/50">
            {activeRoom ? (
              <>
                <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold uppercase shadow-md shrink-0 bg-indigo-600">
                      {activeRoom.loai_phong === "nhom" ? (
                        <Users size={16} />
                      ) : activeRoom.avatar ? (
                        <img
                          src={buildUploadUrl(activeRoom.avatar)}
                          alt={activeRoom.ten_hien_thi}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        activeRoom.ten_hien_thi?.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">
                        {activeRoom.ten_hien_thi}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        {activeRoom.loai_phong === "nhom"
                          ? `${activeRoom.so_thanh_vien} thành viên`
                          : "Trò chuyện cá nhân"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 text-gray-400">
                    <button
                      type="button"
                      onClick={() => startCall("voice")}
                      disabled={activeRoom.loai_phong === "nhom"}
                      className="p-2.5 hover:bg-green-100 hover:text-green-600 rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Phone size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => startCall("video")}
                      disabled={activeRoom.loai_phong === "nhom"}
                      className="p-2.5 hover:bg-blue-100 hover:text-blue-600 rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Video size={18} />
                    </button>
                    <button
                      type="button"
                      className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => {
                    const isMine =
                      Number(message.id_nguoi_gui) === Number(user?.id);
                    return (
                      <div
                        key={message.id}
                        className={`flex items-end gap-3 ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        {!isMine && (
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                            {message.anh_dai_dien ? (
                              <img
                                src={buildUploadUrl(message.anh_dai_dien)}
                                alt={message.ten_nguoi_gui}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-slate-600">
                                {message.ten_nguoi_gui?.charAt(0)}
                              </span>
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-[78%] p-3.5 rounded-2xl text-[13.5px] shadow-sm ${
                            isMine
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-white text-slate-700 rounded-tl-none border border-gray-100"
                          }`}
                        >
                          {activeRoom.loai_phong === "nhom" && !isMine && (
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
                              {message.ten_nguoi_gui}
                            </p>
                          )}

                          {renderMessageContent(message)}

                          <p
                            className={`text-[9px] mt-2 opacity-60 font-bold ${
                              isMine ? "text-right" : "text-left"
                            }`}
                          >
                            {new Date(message.thoi_gian_gui).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleSendTextMessage}
                  className="p-4 bg-white border-t border-gray-100 flex items-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelected}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sendingMedia}
                    className="p-2.5 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-40"
                  >
                    <ImageIcon size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleRecording}
                    disabled={sendingMedia}
                    className={`p-2.5 transition-colors disabled:opacity-40 ${
                      isRecording
                        ? "text-red-500"
                        : "text-gray-400 hover:text-blue-600"
                    }`}
                  >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  <input
                    type="text"
                    placeholder={
                      isRecording ? "Đang ghi âm..." : "Nhập tin nhắn..."
                    }
                    className="flex-1 bg-gray-100 border-none rounded-2xl py-3 px-5 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isRecording}
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-500 mb-4">
                  <MessageSquare size={40} />
                </div>
                <p className="font-black text-slate-800">Bắt đầu trò chuyện</p>
                <p className="text-xs text-gray-400 mt-1">
                  Chọn một hội thoại hoặc tạo nhóm chat mới
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => !creatingGroup && setShowCreateGroup(false)}
            aria-hidden="true"
          />

          <form
            onSubmit={handleCreateGroup}
            className="relative z-10 w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-white p-8 space-y-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Tạo nhóm chat
                </p>
                <h2 className="text-2xl font-black text-slate-900">Nhóm mới</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="p-2 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 font-bold text-slate-700 outline-none focus:border-blue-300"
              placeholder="Tên nhóm chat"
            />

            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Chọn thành viên
              </p>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {friends.map((friend) => {
                  const active = selectedMembers.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleToggleMember(friend.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                        active
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center font-black uppercase shrink-0">
                          {friend.anh_dai_dien ? (
                            <img
                              src={buildUploadUrl(friend.anh_dai_dien)}
                              alt={friend.ten}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            friend.ten?.charAt(0)
                          )}
                        </div>
                        <span className="font-bold truncate">{friend.ten}</span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 ${
                          active
                            ? "border-blue-600 bg-blue-600"
                            : "border-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingGroup}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-900 transition-colors disabled:opacity-50"
            >
              {creatingGroup ? "Đang tạo..." : "Tạo nhóm"}
            </button>
          </form>
        </div>
      )}

      {isInCall && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-6 max-w-4xl w-full shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-gray-900">
                {callType === "video" ? "Cuộc gọi video" : "Cuộc gọi thoại"} với{" "}
                {activeRoom?.ten_hien_thi || "người dùng"}
              </h3>
            </div>

            <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-6 h-[400px]">
              {callType === "video" ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute top-4 right-4 w-36 h-28 object-cover rounded-2xl border-2 border-white shadow-lg"
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl font-bold uppercase">
                        {activeRoom?.ten_hien_thi?.charAt(0)}
                      </span>
                    </div>
                    <p className="text-white text-lg font-medium">
                      {activeRoom?.ten_hien_thi}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleMute}
                className={`p-4 rounded-full transition-colors ${
                  isMuted
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>

              {callType === "video" && (
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-colors ${
                    isVideoOff
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-6 h-6 text-white" />
                  ) : (
                    <Video className="w-6 h-6 text-white" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={endCall}
                className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
