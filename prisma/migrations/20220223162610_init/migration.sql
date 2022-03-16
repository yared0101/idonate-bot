-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "telegramId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "tgUsername" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ngo" (
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,

    CONSTRAINT "ngo_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "membership" (
    "pageId" TEXT,
    "id" SERIAL NOT NULL,
    "toBeSentFile" TEXT NOT NULL,
    "ngoName" TEXT NOT NULL,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed" (
    "pageId" TEXT,
    "id" SERIAL NOT NULL,
    "ngoName" TEXT NOT NULL,

    CONSTRAINT "fixed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly" (
    "pageId" TEXT,
    "id" SERIAL NOT NULL,
    "ngoName" TEXT NOT NULL,

    CONSTRAINT "monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "pageId" TEXT,
    "id" SERIAL NOT NULL,
    "ngoName" TEXT NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "any" (
    "pageId" TEXT,
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "ngoName" TEXT NOT NULL,

    CONSTRAINT "any_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confirmed" (
    "id" SERIAL NOT NULL,
    "screenshot" TEXT,
    "confirmedById" INTEGER NOT NULL,
    "anyId" INTEGER,
    "eventId" INTEGER,
    "monthlyId" INTEGER,
    "fixedId" INTEGER,
    "membershipId" INTEGER,
    "membershipFile" TEXT,

    CONSTRAINT "confirmed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_telegramId_key" ON "user"("telegramId");

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_ngoName_fkey" FOREIGN KEY ("ngoName") REFERENCES "ngo"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed" ADD CONSTRAINT "fixed_ngoName_fkey" FOREIGN KEY ("ngoName") REFERENCES "ngo"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly" ADD CONSTRAINT "monthly_ngoName_fkey" FOREIGN KEY ("ngoName") REFERENCES "ngo"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_ngoName_fkey" FOREIGN KEY ("ngoName") REFERENCES "ngo"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "any" ADD CONSTRAINT "any_ngoName_fkey" FOREIGN KEY ("ngoName") REFERENCES "ngo"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmed" ADD CONSTRAINT "confirmed_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmed" ADD CONSTRAINT "confirmed_anyId_fkey" FOREIGN KEY ("anyId") REFERENCES "any"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmed" ADD CONSTRAINT "confirmed_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmed" ADD CONSTRAINT "confirmed_monthlyId_fkey" FOREIGN KEY ("monthlyId") REFERENCES "monthly"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmed" ADD CONSTRAINT "confirmed_fixedId_fkey" FOREIGN KEY ("fixedId") REFERENCES "fixed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confirmed" ADD CONSTRAINT "confirmed_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
