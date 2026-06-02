-- CreateTable
CREATE TABLE "ResetPasswordOrder" (
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResetPasswordOrder_pkey" PRIMARY KEY ("orderId")
);

-- AddForeignKey
ALTER TABLE "ResetPasswordOrder" ADD CONSTRAINT "ResetPasswordOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
