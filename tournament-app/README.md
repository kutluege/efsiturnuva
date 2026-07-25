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
- 📧 E-posta ile şifresiz giriş (Firebase email-link) — liglerin her cihazda otomatik listelenir
- 🔑 Lig kodunu bilen herkes ligi canlı izleyebilir; yönetim yetkisi e-postaya bağlıdır
- 👑 Çoklu yönetici: lig yöneticisi başka e-postaları da yönetici yapabilir
- 🗑️ Liglerim ekranından lig silme (kalıcı) ya da sadece listeden kaldırma
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

## Canlı Takip ve Hesap Sistemi (Firebase)

Bir lig oluşturduğunuzda uygulama otomatik olarak 4 haneli bir **lig kodu** üretir. Bu kodu paylaştığınız kişiler, ana sayfadaki "Bir Lige Katıl" alanına (veya size gönderilen `?join=KOD` bağlantısına) girerek ligi gerçek zamanlı izleyebilir.

**Yönetim yetkisi e-postaya bağlıdır:** siteye ilk girişte e-posta adresiniz sorulur; adresinize gelen tek kullanımlık bağlantıya tıklayarak (şifresiz) giriş yaparsınız. Lig kurduğunuzda liginiz hesabınıza bağlanır ve giriş yaptığınız her cihazda "Liglerim" altında otomatik görünür. Yöneticisi olduğunuz liglerde 👑 butonundan başka e-postaları da yönetici yapabilirsiniz; o kişiler kendi e-postalarıyla giriş yapınca lig onların listesinde de belirir. Skor girme/düzeltme, kadro ve kura işlemleri sadece yöneticilere açıktır; lig silme de öyle.

Bu özellikler [Firebase](https://firebase.google.com/) (Firestore + Authentication) kullanır ve kendi ücretsiz Firebase projenizi gerektirir:

1. https://console.firebase.google.com adresinden yeni bir proje oluşturun.
2. Proje içinde **Firestore Database** oluşturun (herhangi bir bölge, "production mode").
3. **Authentication** → Get started → Sign-in method → **Email/Password** sağlayıcısını etkinleştirin ve **"Email link (passwordless sign-in)"** seçeneğini işaretleyip kaydedin.
4. Authentication → Settings → **Authorized domains**: `localhost` zaten listede; canlı sitenizin alan adını (ör. `efsiturnuva.vercel.app` ve varsa özel alan adınızı) ekleyin. Not: Vercel *preview* URL'leri tek tek eklenmedikçe giriş bağlantıları preview'larda çalışmaz.
5. (İsteğe bağlı) Authentication → Templates bölümünden giriş e-postasının dilini Türkçe yapabilirsiniz.
6. Firestore → Rules sekmesine gidip aşağıdaki kuralları yapıştırın ve yayınlayın:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       function isSignedIn() {
         return request.auth != null && request.auth.token.email != null;
       }
       function isAdminOf(data) {
         return isSignedIn() && ('adminEmails' in data)
           && request.auth.token.email in data.adminEmails;
       }
       function hasValidAdminEmails(data) {
         return (data.adminEmails is list)
           && data.adminEmails.size() >= 1 && data.adminEmails.size() <= 10;
       }
       function isValidTournamentDoc(data) {
         return data.keys().hasAll(['name', 'participants', 'rounds', 'currentRound'])
           && (data.name is string) && (data.name.size() < 200)
           && (data.participants is list) && (data.participants.size() <= 32)
           && (data.rounds is list);
       }

       match /tournaments/{code} {
         // Anyone with the 4-digit code can watch a single league.
         allow get: if true;

         // "My leagues": only queries provably restricted to the caller's own
         // email pass, i.e. where('adminEmails', 'array-contains', <my email>).
         allow list: if isSignedIn()
           && request.auth.token.email in resource.data.adminEmails;

         // New leagues: creator must be signed in and list themselves as admin.
         allow create: if code.matches('^[0-9]{4}$')
           && isValidTournamentDoc(request.resource.data)
           && isSignedIn()
           && hasValidAdminEmails(request.resource.data)
           && request.auth.token.email in request.resource.data.adminEmails
           && !('adminKey' in request.resource.data);

         allow update: if isValidTournamentDoc(request.resource.data)
           && (
             // Modern docs: only a current admin may write, and the admin
             // list must stay a non-empty list after the write.
             (isAdminOf(resource.data) && hasValidAdminEmails(request.resource.data))
             ||
             // Legacy docs (created before auth, no adminEmails yet): the old
             // regime — adminKey can never change. A signed-in user may
             // "claim" the league by setting adminEmails to their own email.
             (
               !('adminEmails' in resource.data)
               && (!('adminKey' in resource.data)
                   || request.resource.data.adminKey == resource.data.adminKey)
               && (
                 !('adminEmails' in request.resource.data)
                 || (isSignedIn()
                     && request.resource.data.adminEmails == [request.auth.token.email])
               )
             )
           );

         // Deleting requires being an admin (legacy leagues must be claimed first).
         allow delete: if isAdminOf(resource.data);

         // Viewer notes: anyone can read and append short named notes.
         // Admins may delete notes (also used to purge the subcollection
         // BEFORE deleting the league document).
         match /messages/{messageId} {
           allow read: if true;
           allow create: if request.resource.data.keys().hasAll(['name', 'text'])
             && (request.resource.data.name is string)
             && (request.resource.data.name.size() >= 1)
             && (request.resource.data.name.size() <= 30)
             && (request.resource.data.text is string)
             && (request.resource.data.text.size() >= 1)
             && (request.resource.data.text.size() <= 200);
           allow update: if false;
           allow delete: if isSignedIn()
             && request.auth.token.email in
                get(/databases/$(database)/documents/tournaments/$(code)).data.adminEmails;
         }
       }

       match /{document=**} { allow read, write: if false; }
     }
   }
   ```
7. Proje ayarları → "Your apps" → Web app ekleyin, verilen `firebaseConfig` değerlerini kopyalayın.
8. Bu klasörde `.env.example` dosyasını `.env.local` olarak kopyalayıp değerleri doldurun.
9. Vercel'de canlıya almak için aynı altı `VITE_FIREBASE_*` değişkenini Project → Settings → Environment Variables kısmına (Production ve Preview için) ekleyin ve yeniden deploy edin.

Bu değişkenler ayarlanmazsa uygulama sorunsuz çalışmaya devam eder; giriş ekranı çıkmaz, canlı takip ve hesap özellikleri devre dışı kalır (turnuvalar cihazınızda localStorage ile korunur).

### Eski (Yönetici ID'li) liglerin taşınması

Bu sürümden önce kurulmuş liglerde yönetim 8 haneli **Yönetici ID** (adminKey) ile yapılıyordu. Böyle bir ligin kodunu "Bir Lige Katıl" alanına girdiğinizde, giriş yapmışsanız bir **"Yönetimi Devral"** paneli açılır: eski Yönetici ID'yi doğru girerseniz lig hesabınıza bağlanır (`adminEmails` alanı yazılır) ve artık e-posta ile yönetilir. Sahiplenilmemiş eski ligler silinemez — önce devralınmaları gerekir.

**Güvenlik notları:**
- Yönetim yetkisi artık Firestore kurallarında sunucu tarafında doğrulanır: skor/kadro/kura güncellemeleri ve silme, yalnızca `adminEmails` listesindeki doğrulanmış bir e-postayla giriş yapmış kullanıcılara açıktır.
- Lig dokümanı kodu bilen herkesçe okunabildiği için (`get: true`) yönetici e-posta adresleri de kodu bilenlerce görülebilir. Bu, "ayrı kullanıcı koleksiyonu yok" tasarımının bilinçli bir ödünüdür.
- Eski liglerdeki "devralma" adımı kriptografik değildir (adminKey dokümandan okunabilir) — eski sistemle aynı güven seviyesindedir ve yalnızca geçiş dönemi için vardır.

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