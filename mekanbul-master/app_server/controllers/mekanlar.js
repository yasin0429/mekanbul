//anaSayfa controller metodu
//index.js dosyasındaki router.get('/',ctrlMekanlar.anaSayfa);
//ile metot url'ye bağlanıyor
//API'ye bağlanabilmek için request modulünü ekle
var request = require('request');
//api seçeneklerini ayarla
//Eğer üretim ortamında çalışıyorsa herokudan al
//Lokalde çalışıyorsa localhost varsayılan sunucu
var apiSecenekleri = {
  sunucu : "https://yasindonmezlogin.herokuapp.com",
  apiYolu: '/api/mekanlar/'
};

var mesafeyiFormatla = function (mesafe) {
  var yeniMesafe, birim;
  if (mesafe> 1) {
    yeniMesafe= parseFloat(mesafe).toFixed(1);
    birim = 'km';
  } else {
    yeniMesafe = parseInt(mesafe * 1000,10);
    birim = 'm'; 
  }
    return yeniMesafe + birim;
  };

var anaSayfaOlustur = function(req, res,cevap, mekanListesi){
  var mesaj;
//Gelen mekanListesi eğer dizi tipinde değilse hata ver.
if (!(mekanListesi instanceof Array)) {
  mesaj = "API HATASI: Birşeyler ters gitti";
  mekanListesi = [];
} else {//Eğer belirlenen mesafe içinde mekan bulunamadıysa bilgilendir
  if (!mekanListesi.length) {
    mesaj = "Civarda Herhangi Bir Mekan Bulunamadı!";
  }
}
res.render('mekanlar-liste', 
  { 
  title: 'MekanBul-Yakınındaki Mekanları Bul',
  sayfaBaslik:{
    siteAd:'MekanBul',
    aciklama:'Yakınınızda Kafeleri, Restorantları Bulun!'
  },
  mekanlar:mekanListesi,
  mesaj: mesaj,
  cevap:cevap
});
};
const anaSayfa=function(req,res){
  var istekSecenekleri;
    istekSecenekleri = 
    {//tam yol
    url : apiSecenekleri.sunucu + apiSecenekleri.apiYolu,
    //Veri çekeceğimiz için GET metodunu kullan
    method : "GET",
    //Dönen veri json formatında olacak
    json : {},
    //Sorgu parametreleri.URL'de yazılan enlem boylamı al
    //localhost:3000/?enlem=37&boylam=30 gibi
    qs : {
      enlem :  req.query.enlem,
      boylam : req.query.boylam
    }
    };//istekte bulun
  request(
    istekSecenekleri,
    //geri dönüş metodu
    function(hata, cevap, mekanlar) {
      var i, gelenMekanlar;
      gelenMekanlar = mekanlar;
      //Sadece 200 durum kodunda ve mekanlar doluyken işlem yap
      if (!hata && gelenMekanlar.length) {
        for (i=0; i<gelenMekanlar.length; i++) {
          gelenMekanlar[i].mesafe = 
          mesafeyiFormatla(gelenMekanlar[i].mesafe);
        }
      }
      anaSayfaOlustur(req, res, cevap,gelenMekanlar);
    } 
  );
}

var detaySayfasiOlustur = function(req, res,mekanDetaylari){
 res.render('mekan-detay', 
 { 
  baslik: mekanDetaylari.ad,
  sayfaBaslik: mekanDetaylari.ad,
  mekanBilgisi:mekanDetaylari
});
}
var hataGoster = function(req, res,durum){
  var baslik,icerik;
  if(durum==404){
    baslik="404, Sayfa Bulunamadı!";
    icerik="Kusura bakma sayfayı bulamadık!";
  }
  else{
     baslik=durum+", Birşeyler ters gitti!";
     icerik="Ters giden birşey var!";
  }
 res.status(durum);
 res.render('hata',{
    baslik:baslik,
    icerik:icerik
 });
};

var mekanBilgisiGetir = function(req,res,callback){
  var istekSecenekleri;
  //istek seceneklerini ayarla.
  istekSecenekleri = {
    //tam yol
    url : apiSecenekleri.sunucu + apiSecenekleri.apiYolu + req.params.mekanid,
    //veri çekeceğimiz için get methodunu kullan
    method : "GET",
    //dönen veri json formatında olacak
    json : {}
  };//istekte bulun
  request(
    istekSecenekleri,
    //geri dönüş methodu
    function(hata, cevap, mekanDetaylari){
      var gelenMekan = mekanDetaylari;
      if(!hata){
        //enlem ve boylam bir dizi şeklinde bunu ayır.
        //0'd enlem 1 de boylam var
        gelenMekan.koordinatlar = {
          enlem : mekanDetaylari.koordinatlar[0],
          boylam : mekanDetaylari.koordinatlar[1]
        };
        callback(req,res,gelenMekan);
      } else {
        hataGoster(req,res,cevap.statusCode);
      }
    }
  );
};

//mekanBilgisi controller metodu
//index.js dosyasındaki router.get('/mekan', ctrlMekanlar.mekanBilgisi);
//ile metot url'ye bağlanıyor
const mekanBilgisi=function(req,res,callback){
  mekanBilgisiGetir(req,res, function(req,res,cevap){
    detaySayfasiOlustur(req,res,cevap);
  });
};
//yorumEkle controller metodu
//index.js dosyasındaki router.get('/mekan/yorum/yeni', ctrlMekanlar.yorumEkle);
//ile metot url'ye bağlanıyor
var yorumSayfasiOlustur = function(req, res, mekanBilgisi){
  res.render('yorum-ekle',{'title':mekanBilgisi.ad+ 'Mekanına Yorum Ekle',
    sayfaBaslik:mekanBilgisi.ad+ ' Mekanına Yorum Ekle',
    hata:req.query.hata
  });
};

const yorumEkle=function(req,res){
	mekanBilgisiGetir(req, res, function(req, res, cevap){
    yorumSayfasiOlustur(req,res,cevap);
  });
}

const yorumumuEkle = function(req,res){
  var istekSecenekleri, gonderilenYorum, mekanid;
  mekanid=req.params.mekanid;
  gonderilenYorum = {
    yorumYapan: req.body.name,
    puan: parseInt(req.body.rating, 10),
    yorumMetni: req.body.review
  };
  istekSecenekleri = {
    url : apiSecenekleri.sunucu+ apiSecenekleri.apiYolu+mekanid+'/yorumlar',
    method : "POST",
    json : gonderilenYorum
  };
  if (!gonderilenYorum.yorumYapan || !gonderilenYorum.puan || !gonderilenYorum.yorumMetni) {
    res.redirect('/mekan/'+mekanid+'/yorum/yeni?hata=evet');
  } else {
    request(
      istekSecenekleri,
      function(hata, cevap, body){
        if (cevap.statusCode === 201) {
          res.redirect('/mekan/'+mekanid);
        }
        else if(cevap.statusCode === 400 && body.name ==="ValidationError" ){
          res.redirect('/mekan/'+mekanid+'/yorum/yeni?hata=evet');
        }
        else {
          hataGoster(req, res, cevap.statusCode);
        }
      }
    );
  }
};
var adminSayfasiOlustur = function(req,res,cevap,gelenMekanlar){
  var mesaj;
  if (!(gelenMekanlar instanceof Array)) {

    mesaj = "API HATASI: Birşeyler ters gitti";
    gelenMekanlar = [];
  } else {//Eğer belirlenen mesafe içinde mekan bulunamadıysa bilgilendir
    if (!gelenMekanlar.length) {
    mesaj = "Veritabanında mekan yok !";
    }
  }
  res.render("admin", {
    title: 'MekanBul-Admin',
    sayfaBaslik:{
      siteAd:'MekanBul-Admin',
      aciklama:'Mekanları Yonetin'
    },
    mekanlar : gelenMekanlar,
    mesaj: mesaj,
    cevap : cevap
  });
};

const adminSayfa = function(req,res){
  var istekSecenekleri;
  istekSecenekleri = {
    url : apiSecenekleri.sunucu+apiSecenekleri.apiYolu+"tummekanlar",
    method : "GET",
    json : {}
  };
  request(
    istekSecenekleri,
    function(hata, cevap, mekanlar){
      var gelenMekanlar;
      gelenMekanlar = mekanlar;
      adminSayfasiOlustur(req,res,cevap,gelenMekanlar);
    }
    );
};

var mekanEkleSayfasiOlustur = function(req,res){
    res.render("mekan-ekle", {
      title: 'Yeni Mekan Ekle',
      sayfaBaslik:'Yeni Mekan Ekle'
    });
};

const mekanEkle = function(req,res){
  mekanEkleSayfasiOlustur(req,res);      
};

const mekaniEkle = function(req,res){
  var istekSecenekleri, eklenenMekan;
  eklenenMekan = {
    ad : req.body.mekanAd,
    adres : req.body.mekanAdres,
    imkanlar : req.body.imkanlar,
    enlem : req.body.enlem,
    boylam : req.body.boylam,
    gunler1 : req.body.gunler1,
    acilis1 : req.body.acilis1,
    kapanis1 : req.body.kapanis1,
    kapali1 : false,
    gunler2 : req.body.gunler2,
    acilis2 : req.body.acilis2,
    kapanis2 : req.body.kapanis2,
    kapali2 : false
  };
  istekSecenekleri = {
    url : apiSecenekleri.sunucu + apiSecenekleri.apiYolu,
    method : "POST",
    json : eklenenMekan
  };
  if ( !eklenenMekan.ad || !eklenenMekan.adres || !eklenenMekan.imkanlar || !eklenenMekan.enlem || !eklenenMekan.boylam || !eklenenMekan.gunler1 || !eklenenMekan.acilis1 || !eklenenMekan.kapanis1 || !eklenenMekan.gunler2 || !eklenenMekan.acilis2 || !eklenenMekan.kapanis2) {
    res.redirect('/admin/mekan/yeni?hata=evet');
  } else{
    request(
      istekSecenekleri,
       function(hata, cevap, body){
        if (cevap.statusCode === 201) {
          res.redirect('/admin');
        }
        else if(cevap.statusCode === 400 && body.name ==="ValidationError" ){
          res.redirect('/admin/mekan/yeni?hata=evet');
        }
        else {
          hataGoster(req, res, cevap.statusCode);
        }
      }
    );
  }
};

const mekanSil = function(req,res){
  var istekSecenekleri;
  istekSecenekleri = {
    url : apiSecenekleri.sunucu+apiSecenekleri.apiYolu+req.params.mekanid,
    method : "DELETE",
    json : {}
  };
  request(
    istekSecenekleri,
    function(hata, cevap, sonuc){
      if (cevap.statusCode === 204) {
        res.redirect('/admin');
      }
    }
    );
};

var mekanGuncelleSayfasiOlustur = function(req,res,gelenMekan){
  res.render('mekan-guncelle',{
    title:gelenMekan.ad+' Mekanını Güncelle',
    sayfaBaslik:gelenMekan.ad+' Mekanını Güncelle',
    mekan:gelenMekan
  });
}

const mekanGuncelle = function(req,res){
  var istekSecenekleri;
  //istek seceneklerini ayarla.
  istekSecenekleri = {
    //tam yol
    url : apiSecenekleri.sunucu + apiSecenekleri.apiYolu + req.params.mekanid,
    //veri çekeceğimiz için get methodunu kullan
    method : "GET",
    //dönen veri json formatında olacak
    json : {}
  };//istekte bulun
  request(
    istekSecenekleri,
    //geri dönüş methodu
    function(hata, cevap, mekanDetaylari){
      var imkanlar = "";
      var gelenMekan = mekanDetaylari;
      if(!hata){
        //enlem ve boylam bir dizi şeklinde bunu ayır.
        //0'd enlem 1 de boylam var
        gelenMekan.koordinatlar = {
          enlem : mekanDetaylari.koordinatlar[0],
          boylam : mekanDetaylari.koordinatlar[1]
        };
        gelenMekan.gunler1 = mekanDetaylari.saatler[0].gunler;
        gelenMekan.acilis1 = mekanDetaylari.saatler[0].acilis;
        gelenMekan.kapanis1 = mekanDetaylari.saatler[0].kapanis;
        gelenMekan.gunler2 = mekanDetaylari.saatler[1].gunler;
        gelenMekan.acilis2 = mekanDetaylari.saatler[1].acilis;
        gelenMekan.kapanis2 = mekanDetaylari.saatler[1].kapanis;
        for(var i = 0; i<mekanDetaylari.imkanlar.length;i++){
          if(i==0)
            imkanlar = mekanDetaylari.imkanlar[0];
          else
            imkanlar =imkanlar+ ","+mekanDetaylari.imkanlar[i];
        }
        gelenMekan.imkanlar = imkanlar;
        mekanGuncelleSayfasiOlustur(req,res,gelenMekan);
      } else {
        hataGoster(req,res,cevap.statusCode);
      }
    });
};

const mekaniGuncelle = function(req,res){
  var istekSecenekleri, guncellenenMekan;
  guncellenenMekan = {
    ad : req.body.mekanAd,
    adres : req.body.mekanAdres,
    imkanlar : req.body.imkanlar,
    enlem : req.body.enlem,
    boylam : req.body.boylam,
    gunler1 : req.body.gunler1,
    acilis1 : req.body.acilis1,
    kapanis1 : req.body.kapanis1,
    kapali1 : false,
    gunler2 : req.body.gunler2,
    acilis2 : req.body.acilis2,
    kapanis2 : req.body.kapanis2,
    kapali2 : false
  };
  istekSecenekleri = {
    url : apiSecenekleri.sunucu + apiSecenekleri.apiYolu + req.params.mekanid,
    method : "PUT",
    json : guncellenenMekan
  };
  if ( !guncellenenMekan.ad || !guncellenenMekan.adres || !guncellenenMekan.imkanlar || !guncellenenMekan.enlem || !guncellenenMekan.boylam || !guncellenenMekan.gunler1 || !guncellenenMekan.acilis1 || !guncellenenMekan.kapanis1 || !guncellenenMekan.gunler2 || !guncellenenMekan.acilis2 || !guncellenenMekan.kapanis2 ) {
    res.redirect('/admin/mekan/'+req.params.mekanid+'/guncelle?hata=evet');
  } else{
    request(
      istekSecenekleri,
       function(hata, cevap, body){
        if (cevap.statusCode === 200) {
          res.redirect('/admin');
        }
        else if(cevap.statusCode === 400 && body.name ==="ValidationError" ){
          res.redirect('/admin/mekan/'+req.params.mekanid+'/guncelle?hata=evet');
        }
        else {
          hataGoster(req, res, cevap.statusCode);
        }
      }
    );
  }
};
//metotlarımızı kullanmak üzere dış dünyaya aç
//diğer dosyalardan require ile alabilmemizi sağlayacak
module.exports = {
anaSayfa,
mekanBilgisi,
yorumEkle,
adminSayfa,
mekanEkle,
mekaniEkle,
mekanSil,
mekanGuncelle,
mekaniGuncelle,
yorumumuEkle
};
