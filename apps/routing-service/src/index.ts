import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import navigateRoutes from './routes/navigate.route';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1/routes', navigateRoutes);

app.get("/", (req,res)=>{
    res.send("Hello World");
    return;
})

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚀 Routing Service running on port ${PORT}`);
});