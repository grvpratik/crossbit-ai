/*
  Warnings:

  - A unique constraint covering the columns `[id,userId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Chat_id_userId_key" ON "Chat"("id", "userId");
