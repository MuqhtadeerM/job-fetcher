import express from 'express'

// creating express app instance
const app = express();

// middleware
app.use(express.json());


// health check
app.get('/health', (req, res) => {
    res.status(200).json({status: 'ok', message: 'Server is Running'})
});

// if no route this is run
app.use((req, res) => {
    res.status(404).json({error: 'Route not found'})
});


// global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: "Internal error"})
});

export default app;
