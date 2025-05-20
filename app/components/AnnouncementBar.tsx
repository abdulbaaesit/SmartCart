"use client";

import React, { useState } from 'react';
import styles from './AnnouncementBar.module.css';

const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;

  return (
    <div className={styles.announcementBarContainer}>
      <div className="relative w-full max-w-screen-xl mx-auto py-2 px-4 flex items-center justify-center text-white">
        <p className="text-sm">
          Sign up and get <strong>20% off</strong> your first order.{' '}
          <a href="/signup" className="underline font-semibold mx-1">
            Sign Up Now
          </a>
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 text-white cursor-pointer"
          aria-label="Close Announcement"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
