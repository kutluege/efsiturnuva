# Turnuva Yönetim Sistemi

Champions League formatında turnuva organize etmek için geliştirilmiş modern web uygulaması.

## Özellikler

- 🏆 Champions League formatında eleme sistemi
- 📱 Responsive tasarım (mobil uyumlu)
- 🇹🇷 Türkçe arayüz
- 💾 Otomatik veri kaydetme (localStorage)
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
`src/components/TournamentSetup.jsx` dosyasında:
```jsx
<option value={32}>32</option>
```

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