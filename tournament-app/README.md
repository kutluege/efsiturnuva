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
         // The admin key set at creation can never be changed afterwards.
         allow update: if isValidTournamentDoc(request.resource.data)
           && (!('adminKey' in resource.data)
               || request.resource.data.adminKey == resource.data.adminKey);
         allow delete: if false;

         // Viewer notes: anyone can read and append short named notes;
         // nothing can be edited or deleted afterwards.
         match /messages/{messageId} {
           allow read: if true;
           allow create: if request.resource.data.keys().hasAll(['name', 'text'])
             && (request.resource.data.name is string)
             && (request.resource.data.name.size() >= 1)
             && (request.resource.data.name.size() <= 30)
             && (request.resource.data.text is string)
             && (request.resource.data.text.size() >= 1)
             && (request.resource.data.text.size() <= 200);
           allow update, delete: if false;
         }
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

**Güvenlik notu:** Bu tasarımda kullanıcı girişi (Firebase Auth) yoktur. Lig kurulurken üretilen 8 haneli **Yönetici ID** yönetim yetkisini belirler: "Devam Et" için lig koduyla birlikte bu ID gerekir ve Firestore kuralları `adminKey` alanının sonradan değiştirilmesini engeller. Yine de doğrulama istemci tarafında yapıldığı için (doküman `get` ile okunabildiğinden) bu, kriptografik bir erişim kontrolü değil pratik bir korumadır. Gerçek "sahip" koruması istenirse ileride Firebase Anonymous Auth + `ownerUid` alanı eklenebilir.

## Yönetici ID ve E-posta (EmailJS)

Lig kuran kişiye otomatik olarak 8 haneli bir **Yönetici ID** atanır:

- ID, lig kurulduğu anda ekranda bir kez gösterilir ve yönetici görünümündeki üst şeritte durur.
- Skor girme, oynanmış maç skorunu düzeltme, kadro değiştirme ve kura çekme sadece bu ID ile ("Devam Et") mümkündür; kod ile katılanlar sadece izler.
- Kurulum ekranına e-posta adresi girilirse ID bu adrese e-posta ile gönderilir.

E-posta gönderimi için [EmailJS](https://www.emailjs.com) kullanılır (ücretsiz plan yeterli):

1. EmailJS hesabı açın, bir **Email Service** bağlayın (ör. Gmail).
2. Bir **Email Template** oluşturun; şablonda şu değişkenleri kullanın: `{{to_email}}` (alıcı), `{{league_name}}`, `{{league_id}}`, `{{admin_key}}`, `{{join_url}}`.
3. `.env.local` dosyasına `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` değerlerini ekleyin (Vercel'de aynı değişkenleri Environment Variables kısmına da ekleyin).

Bu değişkenler ayarlanmazsa uygulama, kullanıcının kendi posta uygulamasını `mailto:` ile açarak ID'yi içeren hazır bir e-posta oluşturur.

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