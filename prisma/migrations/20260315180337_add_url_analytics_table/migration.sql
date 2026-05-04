-- CreateTable
CREATE TABLE "url_analytics" (
    "id" UUID NOT NULL,
    "url_id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "user_agent" TEXT,
    "referrer" TEXT,

    CONSTRAINT "url_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "url_analytics_url_id_idx" ON "url_analytics"("url_id");

-- AddForeignKey
ALTER TABLE "url_analytics" ADD CONSTRAINT "url_analytics_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "urls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
