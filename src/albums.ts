import { initializeApp } from "firebase/app";
import { getDocs, getFirestore, Timestamp, type FirestoreDataConverter, type WithFieldValue } from "firebase/firestore";
import { collection } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAiATvIjGzb1rikJsCmJyoz_GxzVaDUkZY",
  authDomain: "soundscalz.firebaseapp.com",
  projectId: "soundscalz",
  storageBucket: "soundscalz.firebasestorage.app",
  messagingSenderId: "1062045686996",
  appId: "1:1062045686996:web:b47fa4e1db50ff343daf41"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export type Album = {
  title: string;
  artists: string[];
  releaseDate: Date;
  rating?: number;
};

type AlbumDbModel = {
  title: string;
  artists: string[];
  rating?: number;
  releaseDate: Timestamp;
}

const albumConverter: FirestoreDataConverter<Album, AlbumDbModel> = {
  toFirestore: ({ title, artists, rating, releaseDate }: WithFieldValue<Album>) => {
    return { title, artists, rating, releaseDate: Timestamp.fromDate(releaseDate as Date) }
  },
  fromFirestore: (snapshot) => {
    const { title, artists, releaseDate, rating } = snapshot.data() as AlbumDbModel

    return {
      title, artists, releaseDate: releaseDate.toDate(), rating
    }
  }
}

const querySnapshot = await getDocs(collection(db, "albums").withConverter(albumConverter))

const albums = querySnapshot.docs.map(doc => doc.data())

export { albums };
