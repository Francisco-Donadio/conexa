-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "swapiId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "episodeId" INTEGER NOT NULL,
    "director" TEXT NOT NULL,
    "producer" TEXT NOT NULL,
    "releaseDate" TEXT NOT NULL,
    "openingCrawl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Movie_swapiId_key" ON "Movie"("swapiId");
