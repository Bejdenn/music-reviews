import { initializeApp } from "firebase/app";
import { arrayRemove, getDocs, getFirestore, query, snapshotEqual, Timestamp, where, type DocumentData, type FirestoreDataConverter, type WithFieldValue } from "firebase/firestore";
import { doc, setDoc, collection } from "firebase/firestore"

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
// const albums: Album[] = [
//   {
//     title: "2",
//     artists: ["Mac DeMarco"],
//     release: new Date(2012, 9, 16),
//     stars: 5,
//   },
//   {
//     title: "GINGER",
//     artists: ["BROCKHAMPTON"],
//     release: new Date(2019, 7, 23),
//   },
//   {
//     title: "SATURATION 3",
//     artists: ["BROCKHAMPTON"],
//     release: new Date(2017, 11, 15),
//   },
//   {
//     title: "SATURATION 2",
//     artists: ["BROCKHAMPTON"],
//     release: new Date(2017, 7, 25),
//   },
//   {
//     title: "SATURATION",
//     artists: ["BROCKHAMPTON"],
//     release: new Date(2017, 5, 9),
//   },
//   {
//     title: "Here Comes the Cowboy",
//     artists: ["Mac DeMarco"],
//     release: new Date(2019, 4, 10),
//     stars: 5
//   },
//   {
//     title: "IGOR",
//     artists: ["Tyler, The Creator"],
//     release: new Date(2019, 4, 17),
//   },
//   {
//     title: "CHROMAKOPIA",
//     artists: ["Tyler, The Creator"],
//     release: new Date(2024, 9, 28),
//   },
//   {
//     title: "DON'T TAP THE GLASS",
//     artists: ["Tyler, The Creator"],
//     release: new Date(2025, 6, 21),
//   },
//   {
//     title: "CALL ME IF YOU GET LOST: The Estate Sale",
//     artists: ["Tyler, The Creator"],
//     release: new Date(2023, 2, 31),
//   },
//   {
//     title: "Mr. Morale & The Big Steppers",
//     artists: ["Kendrick Lamar"],
//     release: new Date(2022, 4, 13),
//   },
//   {
//     title: "Guitar",
//     artists: ["Mac DeMarco"],
//     release: new Date(2025, 7, 22),
//   },
//   {
//     title: "To Pimp a Butterfly",
//     artists: ["Kendrick Lamar"],
//     release: new Date(2015, 2, 16),
//   },
//   {
//     title: "GNX",
//     artists: ["Kendrick Lamar"],
//     release: new Date(2024, 10, 22),
//   },
//   {
//     title: "Dawn FM",
//     artists: ["The Weeknd"],
//     release: new Date(2022, 0, 6),
//     stars: 5
//   },
//   {
//     title: "untitled remastered.",
//     artists: ["Kendrick Lamar"],
//     release: new Date(2016, 2, 4),
//   },
//   {
//     title: "good kid, m.A.A.d city (Deluxe)",
//     artists: ["Kendrick Lamar"],
//     release: new Date(2012, 9, 22),
//     stars: 5
//   },
//   {
//     title: "House of Ballons",
//     artists: ["The Weeknd"],
//     release: new Date(2011, 2, 21),
//   },
//   {
//     title: "Thursday",
//     artists: ["The Weeknd"],
//     release: new Date(2011, 7, 18),
//   },
//   {
//     title: "Echoes Of Silence",
//     artists: ["The Weeknd"],
//     release: new Date(2011, 11, 21),
//   },
//   {
//     title: "Kiss Land",
//     artists: ["The Weeknd"],
//     release: new Date(2013, 0, 1),
//   },
//   {
//     title: "Beauty Behind the Madness",
//     artists: ["The Weeknd"],
//     release: new Date(2015, 7, 28),
//   },
//   {
//     title: "Starboy",
//     artists: ["The Weeknd"],
//     release: new Date(2016, 10, 25),
//   },
//   {
//     title: "My Dear Melancholy,",
//     artists: ["The Weeknd"],
//     release: new Date(2018, 2, 30),
//   },
//   {
//     title: "After Hours",
//     artists: ["The Weeknd"],
//     release: new Date(2020, 2, 20),
//     stars: 5
//   },
//   {
//     title: "Hurry Up Tomorrow",
//     artists: ["The Weeknd"],
//     release: new Date(2025, 0, 31),
//   },
//   {
//     title: "Salad Days",
//     artists: ["Mac DeMarco"],
//     release: new Date(2014, 3, 1),
//   },
//   {
//     title: "Another One",
//     artists: ["Mac DeMarco"],
//     release: new Date(2015, 7, 7),
//   },
//   {
//     title: "This Old Dog",
//     artists: ["Mac DeMarco"],
//     release: new Date(2017, 4, 5),
//   },
//   {
//     title: "Five Easy Hot Dogs",
//     artists: ["Mac DeMarco"],
//     release: new Date(2023, 0, 20),
//   },
//   {
//     title: "One Wayne G",
//     artists: ["Mac DeMarco"],
//     release: new Date(2023, 3, 21),
//   },
//   {
//     title: "Overly Dedicated",
//     artists: ["Kendrick Lamar"],
//     release: new Date(2010, 8, 14),
//   },
//   {
//     title: "Section.80",
//     artists: ["Kendrick Lamar"],
//     release: new Date(2011, 6, 2),
//   },
//   {
//     title: "DAMN.",
//     artists: ["Kendrick Lamar"],
//     release: new Date(2017, 3, 14),
//   },
//   {
//     title: "InnerSpeaker",
//     artists: ["Tame Impala"],
//     release: new Date(2010, 4, 21),
//   },
//   {
//     title: "Lonerism",
//     artists: ["Tame Impala"],
//     release: new Date(2012, 9, 5),
//   },
//   {
//     title: "Currents",
//     artists: ["Tame Impala"],
//     release: new Date(2015, 6, 17),
//     stars: 5
//   },
//   {
//     title: "The Slow Rush",
//     artists: ["Tame Impala"],
//     release: new Date(2020, 1, 14),
//   },
//   {
//     title: "Deadbeat",
//     artists: ["Tame Impala"],
//     release: new Date(2025, 9, 17),
//   },
//   {
//     title: "The Velvet Underground",
//     artists: ["The Velvet Underground"],
//     release: new Date(1969, 2, 1),
//     stars: 4,
//   },
//   {
//     title: "L.A. Woman",
//     artists: ["The Doors"],
//     release: new Date(1971, 3, 19),
//     stars: 4
//   }
// ];

const querySnapshot = await getDocs(collection(db, "albums").withConverter(albumConverter))

const albums = querySnapshot.docs.map(doc => doc.data())

export { albums };
