const section = (title, rows) => ({ title, rows })
const row = (title, description, rowId = title) => ({ title, description, rowId })

const MENU_SECTIONS = [
  section('Pesan', [
    row('.ping', 'Cek apakah bot aktif'),
    row('.menu', 'Tampilkan daftar perintah'),
    row('.link', 'Kirim link dengan pratinjau'),
    row('.mention', 'Mention pengirim'),
    row('.reply', 'Balas pesan dengan kutipan'),
    row('.sticker', 'Kirim stiker'),
    row('.react', 'Kirim reaksi ke pesan'),
    row('.unreact', 'Hapus reaksi'),
  ]),
  section('Media', [
    row('.image', 'Kirim gambar dari URL'),
    row('.video', 'Kirim video dari URL'),
    row('.gif', 'Kirim GIF'),
    row('.audio', 'Kirim audio'),
    row('.voice', 'Kirim pesan suara (PTT)'),
    row('.ptv', 'Kirim video lingkaran (PTV)'),
    row('.doc', 'Kirim dokumen PDF'),
    row('.viewonce', 'Kirim gambar sekali lihat'),
    row('.album', 'Kirim album foto'),
    row('.download', 'Unduh media terakhir di chat'),
    row('.grayscale', 'Ubah gambar terakhir ke hitam putih'),
    row('.resize', 'Ubah ukuran gambar terakhir ke lebar 512px'),
    row('.thumbnail', 'Buat thumbnail 200x200 dari gambar terakhir'),
  ]),
  section('Interaktif', [
    row('.list', 'Contoh pesan list'),
    row('.buttons', 'Contoh tombol kompatibel'),
    row('.interactive', 'Contoh native flow'),
    row('.quickreply', 'Contoh quick reply'),
    row('.poll', 'Buat polling'),
  ]),
  section('Chat dan Pesan', [
    row('.edit', 'Edit pesan yang terkirim'),
    row('.delete', 'Hapus pesan untuk semua'),
    row('.pin', 'Sematkan pesan'),
    row('.forward', 'Forward pesan terakhir'),
    row('.markunread', 'Tandai chat belum dibaca'),
    row('.archive', 'Arsipkan chat'),
    row('.mute', 'Bisukan chat 8 jam'),
    row('.star', 'Beri bintang pada pesan'),
  ]),
  section('Profil dan Privasi', [
    row('.pfp', 'Ambil foto profil'),
    row('.exists', 'Cek nomor di WhatsApp'),
    row('.status', 'Cek teks status'),
    row('.mystatus', 'Posting status dengan mention'),
    row('.setname', 'Ubah nama profil bot'),
    row('.setstatus', 'Ubah status profil bot'),
    row('.privacy', 'Perbarui pengaturan privasi'),
    row('.disappear', 'Aktifkan pesan hilang 90 hari'),
  ]),
  section('Blokir', [
    row('.blocklist', 'Lihat daftar blokir'),
    row('.block', 'Blokir pengirim'),
    row('.unblock', 'Buka blokir pengirim'),
  ]),
  section('Grup', [
    row('.creategroup', 'Buat grup baru'),
    row('.groups', 'Lihat semua grup'),
    row('.invitelink', 'Dapatkan link undangan grup', '.invitelink <jid>'),
    row('.joingroup', 'Bergabung ke grup dengan kode', '.joingroup <kode>'),
    row('.groupinfo', 'Lihat info grup', '.groupinfo <jid>'),
  ]),
  section('Newsletter dan Lainnya', [
    row('.createnewsletter', 'Buat newsletter'),
    row('.community', 'Buat komunitas'),
    row('.bots', 'Daftar bot WhatsApp'),
    row('.calllink', 'Buat link panggilan video'),
    row('.typing', 'Simulasikan status mengetik'),
    row('.pay', 'Kirim permintaan pembayaran'),
    row('.contact', 'Kirim kartu kontak'),
    row('.location', 'Kirim lokasi'),
  ]),
]

export default {
  name: 'menu',
  sections: MENU_SECTIONS,
}
