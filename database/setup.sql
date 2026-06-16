CREATE DATABASE IF NOT EXISTS repsnap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE repsnap;

CREATE USER IF NOT EXISTS 'repsnap'@'%' IDENTIFIED BY 'repsnap123';
GRANT ALL PRIVILEGES ON repsnap.* TO 'repsnap'@'%';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS users (
  id           VARCHAR(16)  PRIMARY KEY,
  username     VARCHAR(50)  UNIQUE NOT NULL,
  display_name VARCHAR(60)  NOT NULL,
  password     VARCHAR(255) NOT NULL,
  bio          VARCHAR(120),
  avatar       VARCHAR(500),
  created_at   BIGINT       NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      VARCHAR(64)  PRIMARY KEY,
  user_id    VARCHAR(16)  NOT NULL,
  expires_at BIGINT       NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
  id         VARCHAR(16)  PRIMARY KEY,
  user_id    VARCHAR(16)  NOT NULL,
  image      VARCHAR(600) NOT NULL,
  caption    TEXT,
  media_type VARCHAR(10)  NOT NULL DEFAULT 'image',
  created_at BIGINT       NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  id         VARCHAR(16) PRIMARY KEY,
  post_id    VARCHAR(16) NOT NULL,
  user_id    VARCHAR(16) NOT NULL,
  created_at BIGINT      NOT NULL,
  UNIQUE KEY uq_like (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS friendships (
  id         VARCHAR(16)                  PRIMARY KEY,
  from_user  VARCHAR(16)                  NOT NULL,
  to_user    VARCHAR(16)                  NOT NULL,
  status     ENUM('pending','accepted')   NOT NULL DEFAULT 'pending',
  created_at BIGINT                       NOT NULL,
  UNIQUE KEY uq_friendship (from_user, to_user),
  FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user)   REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grps (
  id          VARCHAR(16)  PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  description TEXT,
  cover       VARCHAR(500),
  code        VARCHAR(10)  UNIQUE NOT NULL,
  created_by  VARCHAR(16)  NOT NULL,
  created_at  BIGINT       NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_members (
  id        VARCHAR(16)              PRIMARY KEY,
  group_id  VARCHAR(16)              NOT NULL,
  user_id   VARCHAR(16)              NOT NULL,
  role      ENUM('admin','member')   NOT NULL DEFAULT 'member',
  joined_at BIGINT                   NOT NULL,
  UNIQUE KEY uq_member (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES grps(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS group_posts (
  id         VARCHAR(16)  PRIMARY KEY,
  group_id   VARCHAR(16)  NOT NULL,
  user_id    VARCHAR(16)  NOT NULL,
  image      VARCHAR(600) NOT NULL,
  caption    TEXT,
  media_type VARCHAR(10)  NOT NULL DEFAULT 'image',
  created_at BIGINT       NOT NULL,
  FOREIGN KEY (group_id) REFERENCES grps(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress_photos (
  id         VARCHAR(16)  PRIMARY KEY,
  user_id    VARCHAR(16)  NOT NULL,
  image      VARCHAR(600) NOT NULL,
  note       VARCHAR(60),
  created_at BIGINT       NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id           VARCHAR(16)  PRIMARY KEY,
  sender_id    VARCHAR(16)  NOT NULL,
  recipient_id VARCHAR(16),
  group_id     VARCHAR(16),
  content      TEXT,
  attachment   VARCHAR(600),
  attach_type  VARCHAR(10),
  created_at   BIGINT       NOT NULL,
  FOREIGN KEY (sender_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id)     REFERENCES grps(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS signals (
  id         VARCHAR(16)  PRIMARY KEY,
  from_user  VARCHAR(16)  NOT NULL,
  to_user    VARCHAR(16)  NOT NULL,
  type       VARCHAR(30)  NOT NULL,
  data       MEDIUMTEXT,
  created_at BIGINT       NOT NULL
);
