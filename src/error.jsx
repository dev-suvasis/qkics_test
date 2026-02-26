import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Error = ({ setIsErrorPage }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (setIsErrorPage) setIsErrorPage(true);
    return () => {
      if (setIsErrorPage) setIsErrorPage(false);
    };
  }, [setIsErrorPage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-neutral-900 dark:to-neutral-800 text-gray-800 dark:text-white transition-colors duration-300">
      <div className="text-center p-8 animated-fadeIn">
        <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400 mb-4 drop-shadow-lg">
          404
        </h1>
        <h2 className="text-4xl font-bold mb-4">Page Not Found</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </p>

        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-red-400 text-white font-semibold text-lg hover:from-red-400 hover:to-red-500 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
        >
          Back to Home Page
        </button>
      </div>

      <div className="mt-12 text-gray-400 dark:text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} QKICS. All Rights Reserved.
      </div>
    </div>
  );
};

export default Error;
