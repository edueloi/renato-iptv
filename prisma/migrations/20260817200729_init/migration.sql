-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'ADMIN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` VARCHAR(191) NOT NULL,
    `general_qty` INTEGER NULL,
    `username` VARCHAR(191) NOT NULL,
    `due_date` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `extra_field` VARCHAR(191) NULL,
    `contact` VARCHAR(191) NOT NULL,
    `app_used` VARCHAR(191) NOT NULL,
    `service_type` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `bot_status` VARCHAR(191) NULL,
    `last_bot_sent_at` DATETIME(3) NULL,
    `bot_attempts` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `month_ref` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `is_recurring` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bot_config` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `interval_minutes` INTEGER NOT NULL DEFAULT 5,
    `target_inactive` BOOLEAN NOT NULL DEFAULT true,
    `target_overdue` BOOLEAN NOT NULL DEFAULT true,
    `target_upcoming` BOOLEAN NOT NULL DEFAULT true,
    `days_before_due_notice` INTEGER NOT NULL DEFAULT 2,
    `template_inactive` TEXT NOT NULL,
    `template_overdue` TEXT NOT NULL,
    `template_upcoming` TEXT NOT NULL,
    `last_run_timestamp` DATETIME(3) NULL,
    `next_run_timestamp` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bot_logs` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NULL,
    `client_username` VARCHAR(191) NOT NULL,
    `contact` VARCHAR(191) NOT NULL,
    `message_type` VARCHAR(191) NOT NULL,
    `message_content` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `error_message` TEXT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `smtp_host` VARCHAR(191) NOT NULL,
    `smtp_port` INTEGER NOT NULL,
    `secure` BOOLEAN NOT NULL DEFAULT false,
    `smtp_user` VARCHAR(191) NULL,
    `smtp_pass` VARCHAR(191) NULL,
    `sender_name` VARCHAR(191) NOT NULL,
    `sender_email` VARCHAR(191) NULL,
    `backup_recipient_email` VARCHAR(191) NULL,
    `backup_cc_email` VARCHAR(191) NULL,
    `auto_backup_schedule` VARCHAR(191) NOT NULL DEFAULT 'DISABLED',
    `backup_time` VARCHAR(191) NULL,
    `backup_format` VARCHAR(191) NULL,
    `last_backup_sent_at` DATETIME(3) NULL,
    `next_backup_scheduled_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_logs` (
    `id` VARCHAR(191) NOT NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `error_message` TEXT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_templates` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `is_system_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `apps_list` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `apps_list_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bot_logs` ADD CONSTRAINT `bot_logs_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
