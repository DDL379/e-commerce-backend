/*
  Warnings:

  - You are about to drop the column `label` on the `ProductOption` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ProductOption` DROP COLUMN `label`,
    ADD COLUMN `baseIngredients` JSON NOT NULL;
