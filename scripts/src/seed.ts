import { db, usersTable, customersTable, productsTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  const hash = await bcrypt.hash("1234", 10);

  await db.insert(usersTable).values([
    { username: "امیررضا", password: hash, name: "امیررضا احمدی‌نژاد", role: "مدیر فروش / نماینده" },
    { username: "امیرمحمد", password: hash, name: "امیرمحمد یعقوبی", role: "نماینده فروش" },
    { username: "حسام", password: hash, name: "حسام حاتمی", role: "نماینده فروش" },
  ]).onConflictDoNothing();

  await db.insert(customersTable).values([
    { code: "C-101", name: "سوپرمارکت شباهنگ", phone: "09121111111", address: "تهران، خیابان ولیعصر" },
    { code: "C-102", name: "هایپر مارکت پدیده", phone: "09122222222", address: "کرج، عظیمیه" },
    { code: "C-103", name: "فروشگاه رحیمی و پسران", phone: "09123333333", address: "تهران، بازار" },
  ]).onConflictDoNothing();

  await db.insert(productsTable).values([
    { code: "NG-001", name: "ژله تفنگی", category: "ژله", pack: "بسته 30 عددی", price: 30000, stock: 150, image: "🍮" },
    { code: "NG-002", name: "سس ترش 20 گرم", category: "سس و اسپری ترش", pack: "بسته 30 عددی", price: 36000, stock: 240, image: "🥫" },
    { code: "NG-003", name: "آبنبات کپسولی", category: "آبنبات", pack: "بسته 30 عددی", price: 25000, stock: 400, image: "🍬" },
    { code: "NG-004", name: "آبنبات شیشه شیر", category: "آبنبات", pack: "بسته 24 عددی", price: 25000, stock: 0, image: "🍼" },
    { code: "NG-005", name: "آبمیوه پودری زامبی", category: "آبمیوه پودری", pack: "بسته 30 عددی", price: 40000, stock: 85, image: "🥤" },
    { code: "NG-035", name: "آبنبات (تنوعی پرتقال/لیمو)", category: "آبنبات", pack: "بسته 24 عددی", price: 50000, stock: 120, image: "🍭" },
    { code: "NG-036", name: "آدامس متری برند رول گام", category: "آدامس", pack: "بسته 30 عددی", price: 33000, stock: 300, image: "🍬" },
    { code: "NG-037", name: "علی کافه شرکتی درجه یک (40 عددی)", category: "قهوه و کافی", pack: "بسته 40 عددی", price: 20000, stock: 65, image: "☕" },
    { code: "NG-038", name: "علی کافه شرکتی درجه یک (44 عددی)", category: "قهوه و کافی", pack: "بسته 44 عددی", price: 21600, stock: 40, image: "☕" },
    { code: "NG-039", name: "خوشبو کننده دهان قرص لاته", category: "خوشبوکننده دهان", pack: "بسته 30 عددی", price: 40000, stock: 180, image: "💊" },
    { code: "NG-040", name: "پاستیل نوشابه‌ای", category: "پاستیل", pack: "بسته 24 عددی", price: 35000, stock: 95, image: "🐛" },
    { code: "NG-041", name: "مارشمالو کبابی", category: "مارشمالو", pack: "بسته 20 عددی", price: 45000, stock: 30, image: "🍡" },
    { code: "NG-042", name: "تخم مرغ شانسی بزرگ", category: "شانسی (تنوعی)", pack: "بسته 12 عددی", price: 55000, stock: 15, image: "🎁" },
  ]).onConflictDoNothing();

  console.log("Seeded successfully!");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
