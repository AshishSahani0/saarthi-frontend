import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchJournalPosts,
  likeJournalPost,
  commentOnJournalPost,
  createJournalPost,
} from "../../redux/slices/journalSlice";

import PostCreationForm from "../../components/journaling/PostCreationForm";
import JournalPostCard from "../../components/journaling/JournalPostCard";

const JournalingPage = () => {
  const dispatch = useDispatch();
  const { posts, loading } = useSelector((state) => state.journal);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (activeTab === "posts") {
      dispatch(fetchJournalPosts());
    }
  }, [dispatch, activeTab]);

  const handleLike = (postId) => {
    dispatch(likeJournalPost(postId));
  };

  const handleCommentSubmit = (postId, text) => {
    if (text.trim()) {
      dispatch(commentOnJournalPost({ postId, text }));
    }
  };

  const handlePostCreation = (postData) => {
    dispatch(createJournalPost(postData));
    setActiveTab("posts");
  };

  const TabButton = ({ name, label }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`px-4 py-2 font-semibold text-sm sm:text-base transition-colors duration-200 
        ${activeTab === name
          ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
          : "text-gray-500 hover:text-indigo-600"
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">
        Community Journal
      </h1>

      {/* Tab Buttons */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <TabButton name="posts" label="Posts" />
        <TabButton name="upload" label="Create Post" />
      </div>

      <div className="w-full">
        {/* Post Creation Form */}
        {activeTab === "upload" && (
          <PostCreationForm onSubmit={handlePostCreation} />
        )}

        {/* Posts View */}
        {activeTab === "posts" && (
          <>
            {loading && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Loading posts...
              </div>
            )}

            {/* 💻 Desktop/Tablet Grid Layout */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.length === 0 && !loading ? (
                <div className="col-span-full text-center text-gray-500 py-10 bg-white dark:bg-gray-700 rounded-lg shadow-md">
                  No posts yet. Be the first to share your feelings!
                </div>
              ) : (
                posts.map((post) => (
                  <JournalPostCard
                    key={post._id}
                    post={post}
                    currentUser={user}
                    handleLike={handleLike}
                    handleCommentSubmit={handleCommentSubmit}
                  />
                ))
              )}
            </div>

            {/* 📱 Mobile Vertical Reels Layout */}
            <div className="md:hidden w-full">
              <div className="flex flex-col min-h-[calc(100vh-6rem)] overflow-y-auto snap-y snap-mandatory gap-6 pb-6">
                {posts.length === 0 && !loading ? (
                  <div className="h-full flex items-center justify-center snap-start">
                    <div className="w-full text-center text-gray-500 py-10 bg-white dark:bg-gray-700 rounded-lg shadow-md mx-2">
                      No posts yet. Be the first to share your feelings!
                    </div>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post._id}
                      className="min-h-[80vh] flex items-center justify-center p-4 snap-start"
                    >
                      <JournalPostCard
                        post={post}
                        currentUser={user}
                        handleLike={handleLike}
                        handleCommentSubmit={handleCommentSubmit}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JournalingPage;
