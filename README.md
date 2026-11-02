# Keszisi – Előzetes bérlési adatfelvétel
Dunakeszi Sí & Kerékpár Szerviz | Székely Szilárd E.V. + Multiform Solution Kft.

---

## 🚀 Telepítés és indítás (első alkalom)

### 1. Node.js telepítése (ha még nincs)
Töltse le innen: https://nodejs.org (LTS verzió)

### 2. Backend függőségek telepítése
```
cd keszisi/backend
npm install
```

### 3. Frontend függőségek telepítése
```
cd keszisi/frontend
npm install
```

---

## ▶️ Indítás (minden alkalommal)

**Két terminálablak kell egyszerre:**

**1. terminál – Backend:**
```
cd keszisi/backend
node server.js
```
→ Fut: http://localhost:3001

**2. terminál – Frontend:**
```
cd keszisi/frontend
npm start
```
→ Megnyílik: http://localhost:3000

---

## 🌐 Elérési címek

| Mit                     | Cím                                    |
|-------------------------|----------------------------------------|
| Ügyfél form             | http://localhost:3000                  |
| Admin belépés           | http://localhost:3000/admin/login      |
| Admin foglalások        | http://localhost:3000/admin            |
| Admin dokumentumok      | http://localhost:3000/admin/documents  |

---

## 🔑 Admin fiók létrehozása (első belépéskor)

1. Nyissa meg: http://localhost:3000/admin/login
2. Az első megnyitáskor "Első belépés" mód aktív
3. Adjon meg egy felhasználónevet és jelszót (min. 6 karakter)
4. Kattintson "Fiók létrehozása"
5. Ezentúl ezzel léphet be

---

## 📄 Dokumentumok feltöltése

1. Lépjen be az admin felületre
2. Kattintson "Dokumentumok" menüpontra
3. Töltse fel a GDPR PDF-et és a Felelősségi nyilatkozat PDF-et
4. Az ügyfelek azonnal el tudják olvasni a formban

---

## 📱 Tesztelés tableten / telefonon

Ha a tablet/telefon ugyanazon a wifi hálózaton van:
1. A számítógépen futtassa: `ipconfig` (Windows) vagy `ifconfig` (Mac/Linux)
2. Keresse meg a helyi IP-t (pl. 192.168.1.100)
3. A tableten nyissa meg: http://192.168.1.100:3000

---

## 🏗️ Technológiák

- **Frontend:** React 18, React Router 6
- **Backend:** Node.js, Express
- **Adatbázis:** SQLite (fájlalapú, nincs külön telepítés)
- **DIN kalkulátor:** ISO 11088 szabvány szerint

---

## 📁 Fájlok

```
keszisi/
├── backend/
│   ├── server.js      ← API szerver
│   ├── db.js          ← Adatbázis séma
│   ├── din.js         ← DIN kalkulátor (ISO 11088)
│   ├── keszisi.db     ← SQLite adatbázis (automatikusan létrejön)
│   └── uploads/       ← Feltöltött PDF-ek
└── frontend/
    └── src/
        ├── pages/     ← Oldalak
        ├── components/← Komponensek
        └── utils/     ← API, DIN kalkulátor
```
