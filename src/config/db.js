import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) throw new Error('MONGODB_URI is missing. Add it to your .env.');
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  const { name, host } = mongoose.connection;
  console.log(`✅ MongoDB connected: db="${name}" host="${host}"`);
}
