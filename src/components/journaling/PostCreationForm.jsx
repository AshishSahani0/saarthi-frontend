import React from "react";
import { useForm } from "react-hook-form";

const PostCreationForm = ({ onSubmit }) => {
  const { register, handleSubmit, reset } = useForm();

  const handleFormSubmit = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <div className="bg-white dark:bg-gray-700 p-4 sm:p-6 rounded-lg shadow-md mb-6 w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <textarea
          {...register("content", { required: true })}
          rows="4"
          placeholder="Share your feelings or thoughts..."
          className="w-full p-3 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <label className="inline-flex items-center text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              {...register("isAnonymous")}
              className="h-4 w-4 text-indigo-600 rounded focus:ring-0"
            />
            <span className="ml-2">Post anonymously</span>
          </label>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostCreationForm;
