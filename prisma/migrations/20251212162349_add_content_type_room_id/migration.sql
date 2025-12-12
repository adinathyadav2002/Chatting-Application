/*
  Warnings:

  - A unique constraint covering the columns `[roomId]` on the table `Messages` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `roomId` to the `Messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Messages` ADD COLUMN `contentType` ENUM('text', 'video', 'audio', 'image', 'document', 'videoCall') NOT NULL DEFAULT 'text',
    ADD COLUMN `roomId` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Messages_roomId_key` ON `Messages`(`roomId`);
