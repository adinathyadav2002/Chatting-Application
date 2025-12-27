/*
  Warnings:

  - You are about to alter the column `isRead` on the `Messages` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `Messages` MODIFY `isRead` VARCHAR(191) NOT NULL,
    MODIFY `roomId` VARCHAR(191) NULL;
