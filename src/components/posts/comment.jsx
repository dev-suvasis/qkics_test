// src/pages/Comments.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosSecure from "../utils/axiosSecure";
import useCommentLike from "../hooks/useCommentLike";
import { getAccessToken } from "../../redux/store/tokenManager";

import { BiLike, BiSolidLike } from "react-icons/bi";
import { FaReply, FaTrash, FaCrown } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";

import { useSelector, useDispatch } from "react-redux";
import { clearPostViewState } from "../../redux/slices/postViewSlice";

import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";
import UserBadge from "../../components/ui/UserBadge"; // Verify this path if errors occur

/* -------------------------------------------------------
   Reusable Reply Input Component
--------------------------------------------------------- */
function ReplyInput({
  replyContent,
  setReplyContent,
  onSubmit,
  onCancel,
  isDark,
}) {
  return (
    <div className="mt-4 animate-scaleIn origin-top-left">
      <div className={`p-4 rounded-2xl border transition-all ${isDark
        ? "bg-white/5 border-white/10 focus-within:bg-white/10 focus-within:border-white/20"
        : "bg-black/5 border-black/5 focus-within:bg-white focus-within:border-black/10 focus-within:shadow-lg"
        }`}>
        <textarea
          rows="2"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Write a reply..."
          className={`w-full bg-transparent outline-none resize-none text-sm font-medium ${isDark ? "text-white placeholder:text-neutral-500" : "text-black placeholder:text-neutral-400"}`}
          autoFocus
        />
        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={onCancel}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${isDark ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"
              }`}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Comments() {
  const { id: postId } = useParams();
  const navigate = useNavigate();

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const dispatch = useDispatch();
  const { data: user, theme } = useSelector((state) => state.user);
  const postView = useSelector((state) => state.postView);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);

  const [expandedComments, setExpandedComments] = useState({});
  const [expandedPost, setExpandedPost] = useState(false);

  const toggleCommentExpansion = (id) => {
    setExpandedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [activeReplyBox, setActiveReplyBox] = useState(null);

  const [openReplies, setOpenReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  const [replyNextCursor, setReplyNextCursor] = useState({});


  const loaderRef = useRef(null);

  const isDark = theme === "dark";
  const text = isDark ? "text-[#eaeaea]" : "text-[#111111]";
  const mutedText = isDark ? "text-neutral-500" : "text-neutral-500";
  const bg = isDark ? "bg-[#0a0a0a]" : "bg-[#f8f9fa]";
  const cardBg = isDark ? "bg-[#141414]" : "bg-white";
  const borderColor = isDark ? "border-white/5" : "border-black/5";


  const normalizeContent = (text, previewLimit = 300, fullLimit = 5000) => {
    const normalized = text.slice(0, fullLimit);

    return {
      preview_content: normalized.slice(0, previewLimit),
      full_content: normalized,
    };
  };


  /* -------------------------------------------------------
      LIKE HOOK
  --------------------------------------------------------- */
  const { handleCommentLike } = useCommentLike(
    setComments,
    () => getAccessToken(),
    () => alert("Please log in.")
  );

  /* -------------------------------------------------------
      FETCH POST
  --------------------------------------------------------- */
  const fetchPostDetails = async () => {
    const res = await axiosSecure.get(`/v1/community/posts/${postId}/`);
    setPost(res.data);
  };

  /* -------------------------------------------------------
      FETCH COMMENTS
  --------------------------------------------------------- */
  const fetchComments = async () => {
    const res = await axiosSecure.get(
      `/v1/community/posts/${postId}/comments/`
    );

    setComments(
      res.data.results.map((c) => ({
        ...c,
        replies: [],
        reply_count: c.total_replies,
      }))
    );
    setNextCursor(res.data.next);
  };

  /* -------------------------------------------------------
      LOAD MORE COMMENTS
  --------------------------------------------------------- */
  const loadMoreComments = async () => {
    if (!nextCursor) return;

    const res = await axiosSecure.get(nextCursor);

    setComments((prev) => [
      ...prev,
      ...res.data.results.map((c) => ({
        ...c,
        replies: [],
        reply_count: c.total_replies,
      })),
    ]);
    setNextCursor(res.data.next);
  };

  /* -------------------------------------------------------
      LOAD REPLIES
  --------------------------------------------------------- */
  const loadReplies = async (commentId, cursor = null) => {
    // toggle close
    if (openReplies[commentId] && !cursor) {
      setOpenReplies((p) => ({ ...p, [commentId]: false }));
      return;
    }

    setLoadingReplies((p) => ({ ...p, [commentId]: true }));

    const url = cursor
      ? cursor
      : `/v1/community/comments/${commentId}/replies/`;

    const res = await axiosSecure.get(url);

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
            ...c,
            replies: cursor
              ? [...c.replies, ...res.data.results]
              : res.data.results,
          }
          : c
      )
    );

    setReplyNextCursor((p) => ({
      ...p,
      [commentId]: res.data.next,
    }));

    setOpenReplies((p) => ({ ...p, [commentId]: true }));
    setLoadingReplies((p) => ({ ...p, [commentId]: false }));
  };



  /* -------------------------------------------------------
      ADD COMMENT
  --------------------------------------------------------- */
  const addComment = async () => {
    if (!user || !content.trim()) return;

    const payload = normalizeContent(content, 300, 5000);

    const res = await axiosSecure.post(
      `/v1/community/posts/${postId}/comments/`,
      payload
    );

    setComments((p) => [
      { ...res.data, replies: [], reply_count: 0 },
      ...p,
    ]);

    setContent("");
  };


  /* -------------------------------------------------------
      ADD REPLY
  --------------------------------------------------------- */
  const addReply = async (commentId) => {
    if (!user || !replyContent.trim()) return;

    const payload = normalizeContent(replyContent, 300, 5000);

    const res = await axiosSecure.post(
      `/v1/community/comments/${commentId}/replies/`,
      payload
    );

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
            ...c,
            replies: [...c.replies, res.data],
            reply_count: c.reply_count + 1,
          }
          : c
      )
    );

    setReplyContent("");
    setActiveReplyBox(null);
    setOpenReplies((p) => ({ ...p, [commentId]: true }));
  };

  /* -------------------------------------------------------
      DELETE COMMENT
  --------------------------------------------------------- */
  const deleteComment = (commentId) => {
    showConfirm({
      title: "Delete Comment?",
      message: "Are you sure you want to delete this comment?",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        await axiosSecure.delete(
          `/v1/community/comments/${commentId}/`
        );
        setComments((p) => p.filter((c) => c.id !== commentId));
        showAlert("Comment deleted", "success");
      },
    });
  };

  /* -------------------------------------------------------
      DELETE REPLY
  --------------------------------------------------------- */
  const deleteReply = (replyId, commentId) => {
    showConfirm({
      title: "Delete Reply?",
      message: "Are you sure you want to delete this reply?",
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        await axiosSecure.delete(
          `/v1/community/replies/${replyId}/`
        );
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                ...c,
                replies: c.replies.filter((r) => r.id !== replyId),
                reply_count: c.reply_count - 1,
              }
              : c
          )
        );
        showAlert("Reply deleted", "success");
      },
    });
  };

  /* -------------------------------------------------------
      INITIAL LOAD
  --------------------------------------------------------- */
  useEffect(() => {
    fetchPostDetails();
    fetchComments();
  }, [postId]);

  /* -------------------------------------------------------
      INFINITE SCROLL
  --------------------------------------------------------- */
  useEffect(() => {
    if (!loaderRef.current) return;

    const obs = new IntersectionObserver(
      (e) => e[0].isIntersecting && loadMoreComments(),
      { threshold: 1 }
    );

    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [nextCursor]);

  if (!post) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} pb-20 px-4 md:px-8`}>
      <div className="max-w-7xl mx-auto">

        {/* BACK BUTTON */}
        <button
          onClick={() => {
            const view = postView;
            dispatch(clearPostViewState());
            navigate(-1);

            setTimeout(() => {
              if (view.from === "normal-profile") {
                sessionStorage.setItem(
                  "normalProfileTab",
                  view.tab || "posts"
                );
              }
              if (view.from === "expert-profile") {
                sessionStorage.setItem(
                  "expertActiveTab",
                  view.tab || "posts"
                );
              }
              window.scrollTo(0, view.scroll || 0);
            }, 150);
          }}
          className={`p-3 rounded-full mb-6 transition-all w-fit ${isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"}`}
        >
          <FiArrowLeft size={20} />
        </button>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT — POST (Sticky) */}
          <div className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-28">
            <div className={`p-6 md:p-8 rounded-3xl border ${borderColor} ${cardBg} shadow-2xl`}>

              {/* POST HEADER */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={post.author.profile_picture || `https://ui-avatars.com/api/?name=${post.author.username}&background=random`}
                  alt="avatar"
                  className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${text} text-lg leading-tight`}>
                      {post.author.first_name ? `${post.author.first_name} ${post.author.last_name || ""}` : post.author.username}
                    </p>
                    {post.author.is_subscribed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/10 mb-0.5">
                        <FaCrown size={10} /> Premium
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>@{post.author.username}</p>
                </div>
              </div>

              <h1 className={`text-2xl md:text-3xl font-black tracking-tight mb-4 ${text}`}>{post.title}</h1>

              {(() => {
                const isLocked = post.is_locked === true;
                const fullContent = post.content || "";
                const previewLength = post.preview_length || 500;
                const isLongContent = !isLocked && fullContent.length > previewLength;

                const displayText = isLocked
                  ? fullContent
                  : (expandedPost ? fullContent : (isLongContent ? fullContent.slice(0, previewLength) + "..." : fullContent));
                const isGated = expandedPost && isLocked;

                return (
                  <div>
                    <p className={`${text} text-sm leading-relaxed opacity-80 font-medium whitespace-pre-wrap`}>
                      {displayText}
                    </p>

                    {(isLocked || isLongContent) && !expandedPost && (
                      <div className="mt-2 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLocked) {
                              showAlert("This feature is available only for subscribed users. Please subscribe to a plan to continue.", "warning");
                            }
                            setExpandedPost(true);
                          }}
                          className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                        >
                          READ MORE ▼
                        </button>
                      </div>
                    )}

                    {isLongContent && expandedPost && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedPost(false);
                        }}
                        className="mt-3 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors block"
                      >
                        READ LESS ▲
                      </button>
                    )}

                    {isGated && (
                      <div className={`mt-3 p-4 rounded-xl border animate-fadeIn ${isDark ? "bg-red-600/10 border-red-600/20" : "bg-red-50 border-red-100"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-[10px] text-white font-black">
                            $
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                            Subscription Required
                          </p>
                        </div>
                        <p className="text-xs opacity-70 mb-4 leading-relaxed">
                          You've reached the free reading limit. Please subscribe to a Premium Plan to unlock the full intelligence of this discovery.
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/subscription");
                          }}
                          className="w-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-3 rounded-xl shadow-lg hover:bg-red-700 transition-all hover:-translate-y-0.5"
                        >
                          Subscribe to Unlock
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TAGS */}
              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${isDark
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}

              {post.image && (
                <div className="mt-8 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-black/50">
                  <img
                    src={post.image}
                    alt="post"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                </div>
              )}

              <div className={`mt-6 pt-6 border-t ${borderColor} flex items-center justify-between text-xs font-bold uppercase tracking-wider ${mutedText}`}>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span>{comments.length} Comments</span>
              </div>
            </div>
          </div>

          {/* RIGHT — COMMENTS */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-8">
            <h2 className={`text-xl font-black uppercase tracking-widest ${text} pl-2`}>Discussion</h2>

            {/* ADD COMMENT */}
            <div className={`p-6 rounded-3xl border transition-all ${isDark
              ? "bg-white/5 border-white/10 focus-within:bg-white/10 focus-within:border-white/20 focus-within:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
              : "bg-white border-black/5 shadow-xl focus-within:shadow-2xl focus-within:border-black/10"
              }`}>
              <textarea
                rows="3"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What are your thoughts?"
                className={`w-full bg-transparent outline-none resize-none text-base font-medium ${isDark ? "text-white placeholder:text-neutral-500" : "text-black placeholder:text-neutral-400"}`}
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={addComment}
                  disabled={!content.trim()}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${content.trim() ? "bg-red-600/90 hover:bg-red-600 text-white shadow-red-600/20" : "bg-neutral-500/20 text-neutral-500 cursor-not-allowed"}`}
                >
                  Post Comment
                </button>
              </div>
            </div>

            {/* COMMENTS LIST */}
            <div className="space-y-6">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`p-6 rounded-3xl border transition-all hover:shadow-lg ${borderColor} ${cardBg}`}
                >
                  {/* COMMENT HEADER */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.author.profile_picture || `https://ui-avatars.com/api/?name=${c.author.username}&background=random`}
                        className="w-10 h-10 rounded-xl"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-sm ${text}`}>@{c.author.username}</p>
                          {c.author.is_subscribed && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/10">
                              <FaCrown size={8} /> 
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] uppercase tracking-wider font-bold opacity-50 ${text}`}>{c.author.user_type}</p>
                      </div>
                    </div>

                    {user?.id === c.author.id && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="p-2 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>

                  {(() => {
                    const expanded = expandedComments[c.id] || false;
                    const isLocked = c.is_locked === true;
                    const fullContent = c.content || "";
                    const previewLength = c.preview_length || 500;
                    const isLongContent = !isLocked && fullContent.length > previewLength;

                    const displayText = isLocked
                      ? fullContent
                      : (expanded ? fullContent : (isLongContent ? fullContent.slice(0, previewLength) + "..." : fullContent));
                    const isGated = expanded && isLocked;

                    return (
                      <div>
                        <p className={`${text} text-sm leading-relaxed mb-4 pl-[52px] whitespace-pre-wrap`}>
                          {displayText}
                        </p>

                        <div className="pl-[52px] mb-4">
                          {(isLocked || isLongContent) && !expanded && (
                            <div className="mt-2 text-sm">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isLocked) {
                                    showAlert("This feature is available only for subscribed users. Please subscribe to a plan to continue.", "warning");
                                  }
                                  toggleCommentExpansion(c.id);
                                }}
                                className="text-xs font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                              >
                                READ MORE ▼
                              </button>
                            </div>
                          )}

                          {isLongContent && expanded && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCommentExpansion(c.id);
                              }}
                              className="mt-3 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors block"
                            >
                              READ LESS ▲
                            </button>
                          )}

                          {isGated && (
                            <div className={`mt-3 p-4 rounded-xl border animate-fadeIn ${isDark ? "bg-red-600/10 border-red-600/20" : "bg-red-50 border-red-100"}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-[10px] text-white font-black">
                                  $
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                                  Subscription Required
                                </p>
                              </div>
                              <p className="text-xs opacity-70 mb-4 leading-relaxed">
                                You've reached the free reading limit. Please subscribe to a Premium Plan to unlock the full intelligence of this discussion.
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate("/subscription");
                                }}
                                className="w-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-3 rounded-xl shadow-lg hover:bg-red-700 transition-all hover:-translate-y-0.5"
                              >
                                Subscribe to Unlock
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ACTIONS */}
                  <div className="flex items-center gap-6 pl-[52px]">
                    <button
                      onClick={() => handleCommentLike(c.id)}
                      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${c.is_liked ? "text-red-500" : "text-neutral-500 hover:text-red-500"}`}
                    >
                      {c.is_liked ? <BiSolidLike size={16} /> : <BiLike size={16} />}
                      {c.total_likes || "Like"}
                    </button>

                    <button
                      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors hover:text-red-500 ${text}`}
                      onClick={() => {
                        setActiveReplyBox(activeReplyBox === `comment-${c.id}` ? null : `comment-${c.id}`);
                        setReplyContent("");
                      }}
                    >
                      <FaReply /> Reply
                    </button>
                  </div>

                  {/* REPLY BOX */}
                  {activeReplyBox === `comment-${c.id}` && (
                    <div className="pl-[52px]">
                      <ReplyInput
                        replyContent={replyContent}
                        setReplyContent={setReplyContent}
                        onSubmit={() => addReply(c.id)}
                        onCancel={() => setActiveReplyBox(null)}
                        isDark={isDark}
                      />
                    </div>
                  )}

                  {/* REPLIES & SHOW MORE */}
                  <div className="pl-[52px] mt-4">
                    {c.reply_count > 0 && (
                      <button
                        className={`text-xs font-bold uppercase tracking-wider text-red-500 hover:underline mb-4`}
                        onClick={() => loadReplies(c.id)}
                      >
                        {openReplies[c.id]
                          ? "Hide Replies"
                          : `Show ${c.reply_count} Replies`}
                      </button>
                    )}

                    {openReplies[c.id] && (
                      <div className="space-y-4 border-l-2 pl-4 border-dashed border-neutral-500/20">
                        {c.replies.map((r) => (
                          <div key={r.id} className="relative group">
                            {/* CONNECTING LINE */}
                            <div className="absolute -left-[22px] top-4 w-4 h-[2px] bg-neutral-500/20"></div>

                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <img
                                  src={r.author.profile_picture || `https://ui-avatars.com/api/?name=${r.author.username}&background=random`}
                                  className="w-6 h-6 rounded-lg"
                                />
                                <p className={`font-bold text-xs ${text}`}>@{r.author.username}</p>
                              </div>

                              {user?.id === r.author.id && (
                                <button
                                  onClick={() => deleteReply(r.id, c.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-red-500 hover:bg-red-500/10 transition-all"
                                >
                                  <FaTrash size={10} />
                                </button>
                              )}
                            </div>

                            <p className={`${text} text-sm ml-8 mb-2`}>{r.content}</p>

                            <div className="flex gap-4 ml-8">
                              <button
                                onClick={() => handleCommentLike(r.id)}
                                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${r.is_liked ? "text-red-500" : "text-neutral-500 hover:text-red-500"}`}
                              >
                                {r.is_liked ? <BiSolidLike size={12} /> : <BiLike size={12} />}
                                {r.total_likes || "Like"}
                              </button>

                              <button
                                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-red-500`}
                                onClick={() => {
                                  setActiveReplyBox(activeReplyBox === `reply-${r.id}` ? null : `reply-${r.id}`);
                                  setReplyContent(`@${r.author.username} `);
                                }}
                              >
                                Reply
                              </button>
                            </div>

                            {activeReplyBox === `reply-${r.id}` && (
                              <div className="ml-8">
                                <ReplyInput
                                  replyContent={replyContent}
                                  setReplyContent={setReplyContent}
                                  onSubmit={() => addReply(c.id)}
                                  onCancel={() => setActiveReplyBox(null)}
                                  isDark={isDark}
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        {/* LOAD MORE REPLIES */}
                        {replyNextCursor[c.id] && (
                          <button
                            onClick={() => loadReplies(c.id, replyNextCursor[c.id])}
                            className="text-xs font-bold uppercase tracking-wider text-blue-500 hover:underline"
                          >
                            {loadingReplies[c.id] ? "Loading..." : "Load more replies"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* LOADER */}
            <div
              ref={loaderRef}
              className="h-12 flex justify-center items-center text-xs font-bold uppercase tracking-widest opacity-50"
            >
              {nextCursor ? "Loading more comments..." : "End of discussion"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}