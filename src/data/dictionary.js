// Kelimeler ve İlişkiler (relations: ID listesi)
export const DICTIONARY_DATA = [
  {
    id: 1,
    word: "Bedâhet",
    meaning: "Açıklık, apaçıklık, belli olma durumu.",
    book: "Saatleri Ayarlama Enstitüsü",
    quote: "Afroditi'nin meselesinde öyle bir bedahet vardı ki inkâra kalkışmak beyhude idi.",
    relations: [2, 5] // Behemehal, Sükût
  },
  {
    id: 2,
    word: "Behemehal",
    meaning: "Her halde, mutlaka, ne olursa olsun.",
    book: "Huzur",
    quote: "Bu adamcağız iki haftadır üst üste haberler gönderiyor, beyefendilerden birinin veya hanımefendinin behemehal teşrif etmelerini rica ediyordu.",
    relations: [6, 1] // Teşrif, Bedâhet
  },
  {
    id: 3,
    word: "Bermutat",
    meaning: "Her zamanki gibi, alışıldığı üzere.",
    book: "Saatleri Ayarlama Enstitüsü",
    quote: "Planları hiç haberim olmadan bermutat ben tetkik ediyordum.",
    relations: [1] // Bedâhet
  },
  {
    id: 4,
    word: "İnbisat",
    meaning: "Genişleme, yayılma, ferahlama.",
    book: "Beş Şehir",
    quote: "Ruhun inbisatı için geniş ve harikulade manzaralar lazımdır.",
    relations: [7, 8] // Münhani, Müheyyiç
  },
  {
    id: 5,
    word: "Sükût",
    meaning: "Susma, sessizlik.",
    book: "Huzur",
    quote: "Mümtaz, sükûtun ne kadar güç, hatta imkânsız olduğunu o akşam anladı.",
    relations: [2, 8] // Behemehal, Müheyyiç
  },
  {
    id: 6,
    word: "Teşrif",
    meaning: "Şereflendirme, onurlandırma, (bir yere) gelme.",
    book: "Mahur Beste",
    quote: "Beyefendi birazdan teşrif edecekler, lütfen salonda bekleyiniz.",
    relations: [2] // Behemehal
  },
  {
    id: 7,
    word: "Münhani",
    meaning: "Eğri, bükülmüş, kavisli çizgi.",
    book: "Beş Şehir",
    quote: "İstanbul'un bütün o münhanileri, kubbeleri ve kemerleri akşam ışığında eriyordu.",
    relations: [4] // İnbisat
  },
  {
    id: 8,
    word: "Müheyyiç",
    meaning: "Heyecan veren, heyecanlandıran.",
    book: "Sahnenin Dışındakiler",
    quote: "Hatiplerin en müheyyiç olanı bile kalabalığı bu kadar çabuk kavrayamazdı.",
    relations: [4, 5] // İnbisat, Sükût
  }
];
