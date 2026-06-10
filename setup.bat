set PATH=%PATH%;C:\Program Files\nodejs
set DATABASE_URL=file:./dev.db
npx prisma db push --accept-data-loss
npx prisma generate
npm install framer-motion clsx tailwind-merge lucide-react
