import React, { useState } from "react";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  ArrowPathRoundedSquareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

const JournalPostCard = ({ post, currentUser, handleLike, handleCommentSubmit }) => {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentInput, setCommentInput] = useState("");

  const handleCommentClick = (e) => {
    e.preventDefault();
    handleCommentSubmit(post._id, commentInput);
    setCommentInput("");
  };

  return (
    <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-lg shadow-md flex flex-col justify-between min-h-[400px]">
      {/* Top and Middle Sections */}
      <div>
        {/* User Info Section (Top) */}
        <div className="flex items-center mb-4">
          <img
            src={
              post.isAnonymous
                ? "/default-anonymous-avatar.png"
                : post.author?.profileImage?.url || "/default-avatar.png"
            }
            alt="Author"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3"
          />
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
              {post.isAnonymous ? "Anonymous User" : post.author?.username}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Post Content Section (Middle) */}
        <div className="text-gray-700 dark:text-gray-300 mb-4 overflow-y-auto max-h-[160px] text-sm sm:text-base whitespace-pre-wrap">
          {post.content}
        </div>
      </div>

      {/* Actions, Comments, and Comment Box Section */}
      <div>
        {/* Actions and Stats Section (Bottom) */}
        <div className="flex flex-wrap items-center justify-between text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-4 mt-4 gap-y-2">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLike(post._id)}
              className="flex items-center hover:text-red-500 transition-colors"
            >
              {post.likes.includes(currentUser._id) ? (
                <HeartSolidIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
              <span className="ml-1 text-xs sm:text-sm">{post.likes.length}</span>
            </button>

            <button
              onClick={() => setShowCommentBox(!showCommentBox)}
              className="flex items-center hover:text-indigo-500 transition-colors"
            >
              <ChatBubbleLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="ml-1 text-xs sm:text-sm">{post.comments.length}</span>
            </button>

            <button className="flex items-center hover:text-green-500 transition-colors">
              <PaperAirplaneIcon className="h-5 w-5 sm:h-6 sm:w-6 transform rotate-45" />
            </button>
          </div>

          <button className="flex items-center text-sm">
            <ArrowPathRoundedSquareIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Comment Section */}
        {showCommentBox && (
          <div className="mt-4 space-y-3">
            {/* Existing Comments */}
            {post.comments.map((comment, index) => (
              <div key={index} className="flex items-start">
                <img
                  src={comment.author?.profileImage?.url || "/default-avatar.png"}
                  alt="Commenter"
                  className="w-8 h-8 rounded-full mr-2 mt-1"
                />
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg w-full">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {comment.author?.username}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}

            {/* Add New Comment */}
            <form
              onSubmit={handleCommentClick}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
              >
                Comment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default JournalPostCard;
