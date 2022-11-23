-- CreateTable
CREATE TABLE "vote" (
    "id" SERIAL NOT NULL,
    "currentVote" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votePics" (
    "id" SERIAL NOT NULL,
    "picture" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "title" TEXT,
    "votes" INTEGER[],
    "telegramPostId" TEXT NOT NULL,
    "voteId" INTEGER NOT NULL,

    CONSTRAINT "votePics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "votePics" ADD CONSTRAINT "votePics_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "vote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
