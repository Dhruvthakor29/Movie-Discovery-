import { Client, Query, Databases ,ID} from "appwrite";

const COLLECTION_ID = '67b701fa0026e7b64023';
const DATABASE_ID = '67b7019c003d2ad67a8f';
const PROJECT_ID = '67b604ab000da0c1f635';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)

const database = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
 
 try {
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal('searchTerm', searchTerm),
  ])


  if(result.documents.length > 0) {
   const doc = result.documents[0];

   await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
    count: doc.count + 1,  // Ensure "count" exists in schema
  });
  
  } else {
   await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
    searchTerm,
    count: 1,
    movie_id: movie.id,
    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
   })
  }
 } catch (error) {
  console.error(error);
 }
}

export const getTrendingMovies = async () => {
  try {
   const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
     Query.limit(5),
     Query.orderDesc("count")
   ])
 
   return result.documents;
  } catch (error) {
   console.error(error);
  }
 }
