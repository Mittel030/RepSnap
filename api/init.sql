CREATE DATABASE IF NOT EXISTS repsnap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE repsnap;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(16) PRIMARY KEY,
  username VARCHAR(40) UNIQUE NOT NULL,
  display_name VARCHAR(60) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  bio VARCHAR(120) DEFAULT '',
  avatar VARCHAR(500) DEFAULT '',
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) PRIMARY KEY,
  user_id CHAR(16) NOT NULL,
  expires_at BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
  id CHAR(16) PRIMARY KEY,
  user_id CHAR(16) NOT NULL,
  image VARCHAR(500) NOT NULL,
  caption TEXT,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  post_id CHAR(16) NOT NULL,
  user_id CHAR(16) NOT NULL,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friendships (
  id CHAR(16) PRIMARY KEY,
  from_user CHAR(16) NOT NULL,
  to_user CHAR(16) NOT NULL,
  status ENUM('pending','accepted') NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL,
  UNIQUE KEY uniq_pair (from_user, to_user),
  FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `groups` (
  id CHAR(16) PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  description TEXT,
  cover VARCHAR(500) DEFAULT '',
  code VARCHAR(10) UNIQUE NOT NULL,
  created_by CHAR(16) NOT NULL,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id CHAR(16) NOT NULL,
  user_id CHAR(16) NOT NULL,
  role ENUM('admin','member') NOT NULL DEFAULT 'member',
  joined_at BIGINT NOT NULL,
  PRIMARY KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_posts (
  id CHAR(16) PRIMARY KEY,
  group_id CHAR(16) NOT NULL,
  user_id CHAR(16) NOT NULL,
  image VARCHAR(500) NOT NULL,
  caption TEXT,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id CHAR(16) PRIMARY KEY,
  user_id CHAR(16) NOT NULL,
  image VARCHAR(500) NOT NULL,
  note VARCHAR(120) DEFAULT '',
  created_at BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id CHAR(16) PRIMARY KEY,
  sender_id CHAR(16) NOT NULL,
  recipient_id CHAR(16) DEFAULT NULL,
  group_id CHAR(16) DEFAULT NULL,
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
);
