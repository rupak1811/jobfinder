import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, RecaptchaVerifier, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmxK3NbE63nFj5j9Hh0tRNer7iqEg3gBs",
  authDomain: "jobportal-29638.firebaseapp.com",
  projectId: "jobportal-29638",
  storageBucket: "jobportal-29638.appspot.com",
  messagingSenderId: "845772030537",
  appId: "1:845772030537:web:31180aa920f52285483598",
  measurementId: "G-HJMLNN835C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

const Stack = createStackNavigator();

// Reusable Button Component
const CustomButton = ({ text, icon, onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Ionicons name={icon} size={24} color="white" />
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);

// Language Selection Screen
function LanguageSelectionScreen({ navigation }) {
  const languages = [
    { code: "en", label: "English", message: "Please select your language." },
    { code: "te", label: "తెలుగు", message: "దయచేసి మీ భాషను ఎంచుకోండి." },
    { code: "hi", label: "हिन्दी", message: "कृपया अपनी भाषा चुनें।" },
  ];

  return (
    <LinearGradient colors={["#2193b0", "#6dd5ed"]} style={styles.container}>
      <Text style={styles.title}>🌍 Select Language</Text>
      {languages.map((lang) => (
        <TouchableOpacity key={lang.code} style={styles.languageButton} onPress={() => navigation.navigate("RoleSelection")}>
          <Text style={styles.languageText}>{lang.label}</Text>
        </TouchableOpacity>
      ))}
    </LinearGradient>
  );
}

// Role Selection Screen
function RoleSelectionScreen({ navigation }) {
  return (
    <LinearGradient colors={["#FF5733", "#FFC300"]} style={styles.container}>
      <Text style={styles.title}>👨‍💼 Choose Your Role</Text>
      <CustomButton text="Job Provider" icon="briefcase" onPress={() => navigation.navigate("Signup", { role: "provider" })} />
      <CustomButton text="Job Finder" icon="search" onPress={() => navigation.navigate("Signup", { role: "finder" })} />
    </LinearGradient>
  );
}

// Signup Screen with Persistent Auth and reCAPTCHA
function SignupScreen({ navigation, route }) {
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [countryCode, setCountryCode] = useState("+1"); // Default country code
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA solved:', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      },
    });

    setRecaptchaVerifier(verifier);

    return () => {
      if (verifier) verifier.clear();
    };
  }, []);

  const handleSignup = async () => {
    try {
      if (!recaptchaVerifier) {
        Alert.alert("Error", "reCAPTCHA verifier not initialized.");
        return;
      }

      const confirmationResult = await signInWithPhoneNumber(auth, countryCode + phone, recaptchaVerifier);
      setConfirmation(confirmationResult);
      setIsCodeSent(true);
      Alert.alert("OTP Sent", "Please enter the OTP sent to your phone.");
    } catch (error) {
      Alert.alert("Signup Error", error.message);
    }
  };

  const handleVerifyCode = async () => {
    try {
      const credential = PhoneAuthProvider.credential(confirmation.verificationId, verificationCode);
      await signInWithCredential(auth, credential);
      Alert.alert("Verification Successful", "You are now logged in!");
      navigation.navigate(route.params.role === "provider" ? "JobProvider" : "JobFinder");
    } catch (error) {
      Alert.alert("Verification Error", "Invalid OTP or error occurred.");
    }
  };

  return (
    <LinearGradient colors={["#ff9966", "#ff5e62"]} style={styles.container}>
      <Text style={styles.title}>📱 Sign Up</Text>

      <View style={styles.countryCodeContainer}>
        <Picker
          selectedValue={countryCode}
          style={styles.countryCodePicker}
          onValueChange={(itemValue) => setCountryCode(itemValue)}
        >
          <Picker.Item label="+1 (USA)" value="+1" />
          <Picker.Item label="+91 (India)" value="+91" />
          <Picker.Item label="+44 (UK)" value="+44" />
        </Picker>
        <TextInput
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
      </View>

      {!isCodeSent ? (
        <>
          <View id="recaptcha-container"></View> {/* Invisible reCAPTCHA widget */}
          <CustomButton text="Send OTP" icon="send" onPress={handleSignup} />
        </>
      ) : (
        <>
          <TextInput
            placeholder="OTP"
            value={verificationCode}
            onChangeText={setVerificationCode}
            style={styles.input}
            keyboardType="number-pad"
          />
          <CustomButton text="Verify OTP" icon="checkmark" onPress={handleVerifyCode} />
        </>
      )}
    </LinearGradient>
  );
}

// Job Provider Dashboard
function JobProviderScreen() {
  const [jobs, setJobs] = useState([]);

  const addJob = async () => {
    const jobData = { business: "Shop", category: "Salesman", salary: "₹10,000" };
    await addDoc(collection(db, "jobs"), jobData);
    setJobs((prevJobs) => [...prevJobs, jobData]); // Update state with new job
  };

  return (
    <LinearGradient colors={["#1c92d2", "#f2fcfe"]} style={styles.container}>
      <Text style={styles.title}>🏢 Job Provider Dashboard</Text>
      <CustomButton text="Post a Job" icon="add-circle" onPress={addJob} />
      <FlatList
        data={jobs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.category}</Text>
            <Text style={styles.cardText}>Salary: {item.salary}</Text>
          </View>
        )}
      />
    </LinearGradient>
  );
}

// Job Finder Dashboard
function JobFinderScreen() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "jobs"));
        setJobs(querySnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        Alert.alert("Error", "Failed to fetch jobs.");
      }
    };
    fetchJobs();
  }, []);

  return (
    <LinearGradient colors={["#43C6AC", "#F8FFAE"]} style={styles.container}>
      <Text style={styles.title}>🔍 Job Finder Dashboard</Text>
      <FlatList
        data={jobs}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.category}</Text>
            <Text style={styles.cardText}>Salary: {item.salary}</Text>
            <CustomButton text="Apply Now" icon="send" onPress={() => Alert.alert("Applied!", "Your application has been sent.")} />
          </View>
        )}
      />
    </LinearGradient>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="JobProvider" component={JobProviderScreen} />
        <Stack.Screen name="JobFinder" component={JobFinderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 20, textAlign: "center" },
  button: { flexDirection: "row", alignItems: "center", backgroundColor: "#ff5722", padding: 10, borderRadius: 5, margin: 10, width: "80%" },
  buttonText: { color: "white", fontSize: 18, marginLeft: 10 },
  languageButton: { backgroundColor: "#2196F3", padding: 15, borderRadius: 5, margin: 5, width: "80%" },
  languageText: { color: "white", fontSize: 18, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, width: "80%", margin: 10, borderRadius: 5 },
  countryCodeContainer: { flexDirection: "row", justifyContent: "space-between", width: "80%" },
  countryCodePicker: { width: "30%" },
  card: { backgroundColor: "#fff", padding: 15, margin: 10, borderRadius: 5, width: "90%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  cardTitle: { fontSize: 20, fontWeight: "bold" },
  cardText: { fontSize: 16, color: "#777" }
});