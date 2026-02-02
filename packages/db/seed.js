import mongoose from "mongoose";
import { connMongo } from "./conn/index.js";
import User from "./model/User.js";
import Teacher from "./model/teacher.js";
import Student from "./model/student.js";
import ClassRoom from "./model/classRoom.js"; // Note: filename is classRoom.js
import Subject from "./model/subject.js";

// CONFIG
const NUM_TEACHERS = 5;
const NUM_STUDENTS = 20;
const NUM_CLASSES = 2;

// Random Helpers
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomStr = () => Math.random().toString(36).substring(7);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPhone = () => `09${randomInt(10000000, 99999999)}`;

async function seed() {
    console.log("🌱 Starting Seed Process...");

    // 1. Connect DB
    // Manual override for localhost if running outside docker
    if (!process.env.MONGODB_URI) {
        process.env.MONGODB_URI = "mongodb://admin:password@localhost:27017/my_database?authSource=admin";
    }
    await connMongo();

    // 2. Clean Data (Optional - usually good for seeding)
    console.log("🧹 Cleaning old data...");
    await Promise.all([
        User.deleteMany({}),
        Teacher.deleteMany({}),
        Student.deleteMany({}),
        ClassRoom.deleteMany({}),
        Subject.deleteMany({}),
    ]);

    // 3. Create Subjects
    console.log(`📚 Creating Subjects (IT Major)...`);
    const subjects = await Subject.insertMany([
        { name: "SQL", code: "SQL101", image: "sql-subject" },
        { name: "Web", code: "WEB101", image: "web-subject" },
    ]);

    // 4. Create Classes
    console.log(`🏫 Creating ${NUM_CLASSES} classes...`);
    const classes = [];
    for (let i = 0; i < NUM_CLASSES; i++) {
        const newClass = await ClassRoom.create({
            name: `Class ${String.fromCharCode(65 + i)}`, // Class A, Class B...
            code: `CLS${100 + i}`,
            ref_subject: randomPick(subjects)._id,
            capacity: 30,
        });
        classes.push(newClass);
    }

    // 5. Create Teachers
    console.log(`👨‍🏫 Creating ${NUM_TEACHERS} teachers...`);
    for (let i = 0; i < NUM_TEACHERS; i++) {
        const name = `Teacher ${i + 1}`;
        const email = `teacher${i + 1}@example.com`;

        // Create Profile
        const teacherProfile = await Teacher.create({
            name,
            dob: "1980-01-01",
            email,
            phone: randomPhone(),
            ref_class: [randomPick(classes)._id], // Assign valid class
            gender: randomPick(["male", "female"]),
        });

        // Create User Linked to Profile
        await User.create({
            email,
            password: "password123", // Will be hashed by pre-save hook
            role: "teacher",
            profileModel: "Teacher",
            ref_profile: teacherProfile._id,
        });
    }

    // 6. Create Students
    console.log(`👨‍🎓 Creating ${NUM_STUDENTS} students...`);
    for (let i = 0; i < NUM_STUDENTS; i++) {
        const name = `Student ${i + 1}`;
        const email = `student${i + 1}@example.com`;

        // Create Profile
        const studentProfile = await Student.create({
            name,
            dob: "2005-01-01",
            email,
            phone: randomPhone(),
            ref_class: [randomPick(classes)._id], // Assign valid class
            gender: randomPick(["male", "female"]),
        });

        // Create User Linked to Profile
        await User.create({
            email,
            password: "password123",
            role: "student",
            profileModel: "Student",
            ref_profile: studentProfile._id,
        });
    }

    // 7. Create Admin
    console.log("🛡️ Creating Admin...");
    await User.create({
        email: "admin@example.com",
        password: "password123",
        role: "admin",
    });

    console.log("✅ Seed Complete!");
    console.log("-------------------------------------");
    console.log("Admin: admin@example.com / password123");
    console.log("Teacher 1: teacher1@example.com / password123");
    console.log("Student 1: student1@example.com / password123");
    console.log("-------------------------------------");

    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed Failed:", err);
    process.exit(1);
});
