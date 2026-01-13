import mongoose, {mongo} from "mongoose";

async function conectaNaDatabase(){
    mongoose.connect("mongodb+srv://wesleymd:Wesley5803@livraria.r8jbgzs.mongodb.net/livraria?appName=Livraria");
    return mongoose.connection;
};

export default conectaNaDatabase;


