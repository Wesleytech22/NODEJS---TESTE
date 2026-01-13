import mongoose from "mongoose";

async function conectaNaDatabase() {
    // Certifique-se do 'L' maiúsculo antes do '?'
    await mongoose.connect("mongodb+srv://wesleymd:Wesley5803@livraria.r8jbgzs.mongodb.net/Livraria?retryWrites=true&w=majority");
    return mongoose.connection;
};

export default conectaNaDatabase;