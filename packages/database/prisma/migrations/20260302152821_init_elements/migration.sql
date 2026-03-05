-- CreateEnum
CREATE TYPE "ElementType" AS ENUM ('RECTANGLE', 'CIRCLE', 'SQUARE', 'PEN', 'PENCIL', 'TEXT', 'ARROW', 'IMAGE');

-- CreateTable
CREATE TABLE "Element" (
    "id" TEXT NOT NULL,
    "type" "ElementType" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "properties" JSONB NOT NULL DEFAULT '{}',
    "zindex" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Element_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Element_roomId_idx" ON "Element"("roomId");

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Element" ADD CONSTRAINT "Element_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
