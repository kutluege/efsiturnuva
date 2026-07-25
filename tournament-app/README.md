# Turnuva Yönetim Sistemi

Champions League formatında turnuva organize etmek için geliştirilmiş modern web uygulaması.

## Özellikler

- 🏆 Champions League formatında eleme sistemi
- 📱 Responsive tasarım (mobil uyumlu)
- 🇹🇷 Türkçe arayüz
- 💾 Otomatik veri kaydetme (localStorage) — sayfa yenilense bile ligler ve skorlar korunur
- 🔢 Her lige otomatik 4 haneli lig kodu — sonraki girişlerde bu kodla lige devam edilebilir
- 🏟️ Birden fazla lig kaydı: ana ekrandan kayıtlı liglere geri dönülebilir
- 👥 Lig sürerken oyuncu ekleme/çıkarma — oynanmış maçlar geçmişe taşınır, fikstür yeniden oluşturulur, istatistikler korunur
- 📜 Geçmiş maçlar görünümü ve kadro değişimlerinden bağımsız oyuncu istatistikleri
- 🔑 Lig kodunu bilen herkes ligi canlı izleyebilir ya da (Firebase yapılandırıldıysa) başka cihazdan yönetici olarak devam edebilir
- 📧 Email ile paylaşım
- ⚙️ Turnuva kuralları ayarlama
- 🎨 Modern ve kullanıcı dostu tasarım

## Kurulum

1. Repository'yi klonlayın:
```bash
git clone [repository-url]
cd tournament-app
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

4. Tarayıcınızda `http://localhost:5173` adresini açın.

## GitHub Pages'e Deployment

### Otomatik Deployment (Önerilen)

1. GitHub repository'nizi oluşturun
2. Kodu GitHub'a push edin:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [your-repo-url]
git push -u origin main
```

3. GitHub repository'nizde:
   - Settings > Pages'e gidin
   - Source olarak "GitHub Actions" seçin
   - Kod her push edildiğinde otomatik deploy olacak

### Manuel Deployment

```bash
npm run build
```

Ardından `dist` klasörünü GitHub Pages'e upload edin.

## Kullanım

### 1. Turnuva Kurulumu
- Turnuva adını girin
- Katılımcı sayısını seçin (4, 8, 16)
- Maç usulünü belirleyin (Tek/Çift maç)
- Katılımcıları ekleyin

### 2. Turnuva Başlatma
- "Kuraları Çek" butonuna tıklayın
- Otomatik bracket oluşturulur

### 3. Maç Sonuçlarını Girme
- Her maçta kazanan oyuncuya tıklayın
- Kazanan otomatik olarak bir sonraki tura geçer

### 4. Turnuva Ayarları
- Puan sistemi ayarlama
- Averaj hesaplama yöntemi
- Email bildirim ayarları

## Teknolojiler

- React 19
- Vite
- CSS3 (Responsive Design)
- LocalStorage (Veri persistence)
- GitHub Actions (CI/CD)

## Özelleştirme

### Tema Değiştirme
`src/App.css` dosyasında renk değişkenleri bulunur:
```css
/* Ana renk paleti */
background: linear-gradient(135deg, #f7b801 0%, #ffc107 50%, #ffdb4d 100%);
```

### Katılımcı Sayısı Artırma
`src/App.jsx` dosyasındaki "Katılımcı Sayısı" input'unun `max` değerini değiştirin.

## Canlı Takip (Firebase)

Bir lig oluşturduğunuzda uygulama otomatik olarak 4 haneli bir **lig kodu** üretir. Bu kodu paylaştığınız kişiler, ana sayfadaki "Bir Lige Katıl" alanına (veya size gönderilen `?join=KOD` bağlantısına) girerek ligi gerçek zamanlı izleyebilir ("Canlı İzle") ya da başka bir cihazdan yönetici olarak devam edebilir ("Devam Et").

Bu özellik [Firebase Firestore](https://firebase.google.com/) kullanır ve çalışması için kendi ücretsiz Firebase projenizi oluşturmanız gerekir:

1. https://console.firebase.google.com adresinden yeni bir proje oluşturun.
2. Proje içinde **Firestore Database** oluşturun (herhangi bir bölge, "production mode").
3. Firestore → Rules sekmesine gidip aşağıdaki kuralları yapıştırın ve yayınlayın:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /tournaments/{code} {
         allow get: if true;
         allow list: if false;
         allow create: if code.matches('^[0-9]{4}$') && isValidTournamentDoc(request.resource.data);
         allow update: if isValidTournamentDoc(request.resource.data);
         allow delete: if false;
       }
       match /{document=**} { allow read, write: if false; }
     }
     function isValidTournamentDoc(data) {
       return data.keys().hasAll(['name', 'participants', 'rounds', 'currentRound'])
         && (data.name is string)
         && (data.name.size() < 200)
         && (data.participants is list)
         && (data.participants.size() <= 32)
         && (data.rounds is list);
     }
   }
   ```
4. Proje ayarları → "Your apps" → Web app ekleyin, verilen `firebaseConfig` değerlerini kopyalayın.
5. Bu klasörde `.env.example` dosyasını `.env.local` olarak kopyalayıp değerleri doldurun.
6. Vercel'de canlıya almak için aynı altı `VITE_FIREBASE_*` değişkenini Project → Settings → Environment Variables kısmına (Production ve Preview için) ekleyin ve yeniden deploy edin.

Bu değişkenler ayarlanmazsa uygulama sorunsuz çalışmaya devam eder, sadece canlı takip özelliği devre dışı kalır (turnuva yine cihazınızda localStorage ile korunur).

**Güvenlik notu:** Bu tasarımda kullanıcı girişi (Firebase Auth) yoktur — takip kodu, verinin kolayca tahmin edilememesini sağlayan paylaşılan bir sırdır, kriptografik bir erişim kontrolü değildir. Kodu bilen biri teorik olarak Firestore SDK'sını doğrudan çağırarak yazma da yapabilir. Gerçek "sahip" koruması istenirse ileride Firebase Anonymous Auth + `ownerUid` alanı eklenebilir.

## Lisans

MIT License

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Destek

Herhangi bir sorun için GitHub Issues kullanın.