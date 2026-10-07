-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `password_hash` VARCHAR(100) NOT NULL,
    `role` ENUM('STUDENT', 'ADMIN', 'STAFF') NOT NULL DEFAULT 'STUDENT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `instructor` VARCHAR(100) NOT NULL,
    `short_description` VARCHAR(300) NOT NULL,
    `description` TEXT NOT NULL,
    `tuition_vnd` INTEGER NOT NULL,
    `capacity` INTEGER NOT NULL,
    `enrolled_count` INTEGER NOT NULL DEFAULT 0,
    `is_published` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `courses_is_published_category_idx`(`is_published`, `category`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollments` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `course_id` CHAR(36) NOT NULL,
    `status` ENUM('ENROLLED') NOT NULL DEFAULT 'ENROLLED',
    `enrolled_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `enrollments_course_id_enrolled_at_idx`(`course_id`, `enrolled_at`),
    INDEX `enrollments_user_id_enrolled_at_idx`(`user_id`, `enrolled_at`),
    UNIQUE INDEX `enrollments_user_id_course_id_key`(`user_id`, `course_id`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `courses`
  ADD CONSTRAINT `courses_tuition_nonnegative` CHECK (`tuition_vnd` >= 0),
  ADD CONSTRAINT `courses_capacity_positive` CHECK (`capacity` > 0),
  ADD CONSTRAINT `courses_count_valid` CHECK (`enrolled_count` >= 0 AND `enrolled_count` <= `capacity`);
