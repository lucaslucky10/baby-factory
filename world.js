/* Resolution-independent, original storybook sets. No external assets or fonts. */
'use strict';
var BF=window.BF||(window.BF={});
(function(BF){
  function backdrops(W,H,gy,name,fx){
    var u=BF.util, n=function(v){return Math.round(v*100)/100;};
    function rect(x,y,w,h,c,r,extra){return '<rect x="'+n(x)+'" y="'+n(y)+'" width="'+n(w)+'" height="'+n(h)+'" rx="'+(r||0)+'" fill="'+c+'" '+(extra||'')+'/>';}
    function path(d,c,extra){return '<path d="'+d+'" fill="'+c+'" '+(extra||'')+'/>';}
    function ell(x,y,rx,ry,c,extra){return '<ellipse cx="'+n(x)+'" cy="'+n(y)+'" rx="'+n(rx)+'" ry="'+n(ry)+'" fill="'+c+'" '+(extra||'')+'/>';}
    function line(x,y,x2,y2,c,w){return '<path d="M'+n(x)+' '+n(y)+'L'+n(x2)+' '+n(y2)+'" fill="none" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round"/>';}
    function text(x,y,t,size,c){return '<text x="'+n(x)+'" y="'+n(y)+'" fill="'+c+'" font-family="sans-serif" font-size="'+size+'">'+u.esc(t)+'</text>';}
    function plant(x,y,scale){
      var s='<g transform="translate('+n(x)+' '+n(y)+') scale('+scale+')">';
      s+=ell(0,0,44,9,'#68584E','opacity=".10"')+line(0,-25,0,-142,'#527E6D',5);
      [-1,1,-1,1].forEach(function(side,i){var yy=-65-i*24;s+=ell(side*18,yy,29,11,i%2?'#89AA8A':'#68977F','transform="rotate('+(side*32)+' '+side*18+' '+yy+')"');});
      s+=path('M-31-52H31L24 0H-24Z','#C88D70')+rect(-34,-56,68,12,'#E1AA89',5)+line(-18,-32,-14,-10,'#E6B598',3);
      return s+'</g>';
    }
    function books(x,y,scale){var s='<g transform="translate('+n(x)+' '+n(y)+') scale('+scale+')">';
      ['#8DAAA9','#D79D87','#DBBD72','#9D99B0','#C8B6A0'].forEach(function(c,i){s+=rect(i*21,-68+(i%3)*9,16,68-(i%3)*9,c,2)+line(i*21+5,-14,i*21+11,-14,'#F7EFE0',2);});return s+'</g>';}
    function windowView(x,y,w,h,evening){
      var s=rect(x-12,y-12,w+24,h+24,'#DAC8AD',Math.min(w/2,80))+rect(x,y,w,h,evening?'#B7C8D2':'#C2DCD9',Math.min(w/2,74));
      s+=ell(x+w*.72,y+h*.26,w*.11,w*.11,evening?'#FFF0BF':'#FFF5CF');
      s+=path('M'+x+' '+(y+h*.7)+'Q'+(x+w*.28)+' '+(y+h*.36)+' '+(x+w*.57)+' '+(y+h*.73)+'Q'+(x+w*.83)+' '+(y+h*.51)+' '+(x+w)+' '+(y+h*.7)+'V'+(y+h)+'H'+x+'Z','#A0BAB2');
      s+=path('M'+x+' '+(y+h*.86)+'Q'+(x+w*.42)+' '+(y+h*.62)+' '+(x+w)+' '+(y+h*.85)+'V'+(y+h)+'H'+x+'Z','#84A399');
      s+=line(x+w/2,y+12,x+w/2,y+h,'#F7EFE0',9)+line(x,y+h*.58,x+w,y+h*.58,'#F7EFE0',8)+rect(x-22,y+h,w+44,15,'#C5AC8E',5);
      return s;
    }
    function rug(c){return ell(fx,gy+12,240,46,c,'opacity=".72"')+ell(fx,gy+12,213,35,'none','stroke="#FFF4DD" stroke-width="2" opacity=".5"');}
    var palettes=[['#F5EADD','#E4CEB2'],['#E5EBE1','#C9D2BB'],['#F4EBD9','#DCCBAD'],['#ECE6E0','#D7C0AA'],['#F5DDC8','#B9C3A0']];
    var s='<defs><linearGradient id="bf-room-light" x2="0" y2="1"><stop stop-color="#FFFFFF" stop-opacity=".4"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient><pattern id="bf-paper-grain" width="21" height="21" patternUnits="userSpaceOnUse"><circle cx="3" cy="6" r=".7" fill="#665B51" opacity=".07"/><circle cx="15" cy="17" r=".6" fill="#FFFFFF" opacity=".4"/></pattern></defs>';
    palettes.forEach(function(p,i){
      s+='<g data-scene="'+i+'" opacity="'+(i===0?1:0)+'">'+rect(0,0,W,H,p[0]);
      if(i<4){
        s+=rect(0,gy*.68,W,gy*.32,p[1],0,'opacity=".25"')+line(0,gy*.68,W,gy*.68,'#FFF8EB',6);
        s+=rect(0,gy,W,H-gy,p[1]);
        for(var j=0;j<13;j++) s+=line(j*155-80,gy,j*200-180,H,'#A38C76',1.2);
        s+=rect(0,gy-8,W,8,'#BEAA91',0,'opacity=".5"');
      }
      var wx=fx+165, wy=gy*.20;
      if(i===0){
        s+=windowView(wx,wy,240,gy*.39,true);
        s+=plant(fx-255,gy,1.05);
        s+=rug('#D8B9B1');
        s+=rect(fx+230,gy-130,270,96,'#D8BFA3',26)+rect(fx+222,gy-140,286,20,'#E9D7C2',8);
        for(var b=0;b<8;b++)s+=rect(fx+244+b*32,gy-112,12,72,'#F6E8D4',4);
        s+=rect(fx+243,gy-34,15,34,'#B49A7D',4)+rect(fx+474,gy-34,15,34,'#B49A7D',4);
        s+=line(fx,0,fx,gy*.14,'#B59E85',2)+path('M'+(fx-90)+' '+(gy*.14+16)+'Q'+fx+' '+(gy*.14-25)+' '+(fx+90)+' '+(gy*.14+16),'none','stroke="#B59E85" stroke-width="3"');
        [-1,0,1].forEach(function(v){var xx=fx+v*83, yy=gy*.14+45+Math.abs(v)*14;s+=line(xx,gy*.14+8,xx,yy,'#B59E85',2)+ell(xx,yy+13,14,18,['#C69789','#D8B765','#8DAEAB'][v+1]);});
        s+=ell(fx-157,gy-13,20,14,'#CAA77B')+ell(fx-163,gy-36,17,17,'#CAA77B')+ell(fx-178,gy-51,7,7,'#CAA77B')+ell(fx-149,gy-51,7,7,'#CAA77B');
      } else if(i===1){
        s+=rect(fx-180,gy*.19,420,gy*.29,'#C8AF8D',12)+rect(fx-167,gy*.19+13,394,gy*.29-26,'#72938A',5);
        s+=text(fx-135,gy*.19+63,'오늘의 발견',29,'#F8F1D9')+text(fx-135,gy*.19+104,'틀려도, 다시 해 봐도 괜찮아.',17,'#E2E8D9');
        s+=line(fx-134,gy*.19+126,fx+139,gy*.19+126,'#C5D6C8',2);
        s+=rect(fx+235,gy-168,250,20,'#C3A382',9)+rect(fx+253,gy-148,13,148,'#9C9C8B',4)+rect(fx+454,gy-148,13,148,'#9C9C8B',4);
        s+=books(fx+264,gy-170,.82)+plant(fx-269,gy,.85)+rug('#B0C0AD');
        s+=ell(fx-242,gy*.34,42,42,'#F9F4E8')+line(fx-242,gy*.34,fx-242,gy*.34-24,'#8A927F',3)+line(fx-242,gy*.34,fx-225,gy*.34+9,'#8A927F',3);
      } else if(i===2){
        s+=windowView(fx+160,gy*.16,285,gy*.43,false)+rug('#D9C49D');
        s+=rect(fx-310,gy-185,135,12,'#B99F81',3)+rect(fx-300,gy-173,12,173,'#B99F81',3)+rect(fx-194,gy-173,12,173,'#B99F81',3)+books(fx-292,gy-185,.82);
        s+=plant(fx+348,gy,.95);
        s+=rect(fx-305,gy*.29,105,140,'#D3AD8E',3,'transform="rotate(-5 '+(fx-250)+' '+(gy*.35)+')"')+rect(fx-295,gy*.29+10,85,120,'#F3E7CF',2)+ell(fx-252,gy*.29+53,22,22,'#D49577')+text(fx-280,gy*.29+103,'작은 시작',16,'#817268');
      } else if(i===3){
        s+=windowView(fx+180,gy*.17,255,gy*.36,false)+rug('#C5BBB0');
        s+=rect(fx+240,gy-135,300,100,'#8EA99B',28)+rect(fx+220,gy-94,340,62,'#A1B7A5',23)+rect(fx+248,gy-32,13,32,'#8B7968',3)+rect(fx+522,gy-32,13,32,'#8B7968',3);
        s+=rect(fx+264,gy-122,74,49,'#D9C7A2',12,'transform="rotate(-12 '+(fx+301)+' '+(gy-98)+')"');
        s+=plant(fx-285,gy,1.3)+rect(fx-180,gy*.26,115,88,'#C0A68A',3)+rect(fx-172,gy*.26+8,99,72,'#F9EAD5',1)+ell(fx-122,gy*.26+38,23,23,'#C99380');
      } else {
        s+=ell(fx+195,gy*.48,115,115,'#F4B680')+path('M0 '+gy*.72+'Q'+W*.3+' '+gy*.46+' '+W*.58+' '+gy*.73+'T'+W+' '+gy*.68+'V'+H+'H0Z','#B4BBA2');
        s+=path('M0 '+gy*.86+'Q'+W*.4+' '+gy*.69+' '+W+' '+gy*.87+'V'+H+'H0Z','#9BAF94');
        s+=path('M'+(fx-100)+' '+H+'Q'+(fx+300)+' '+gy+' '+(fx+120)+' '+gy*.79+'Q'+(fx+420)+' '+gy*.88+' '+(fx+310)+' '+H+'Z','#DED0AF');
        [-320,400,580].forEach(function(dx,k){var x=fx+dx;s+=rect(x-9,gy-240,18,240,'#A18D73',8)+ell(x,gy-260,75+k*10,112,'#91A98B')+ell(x-37,gy-220,58,83,'#A8B991')+line(x,gy-88,x-34,gy-170,'#A18D73',7);});
        s+=rect(fx+218,gy-120,252,18,'#B79675',5)+rect(fx+218,gy-94,252,18,'#B79675',5)+rect(fx+208,gy-58,272,17,'#A98765',5)+rect(fx+232,gy-42,12,42,'#7D8C7E',3)+rect(fx+444,gy-42,12,42,'#7D8C7E',3);
        for(var flower=0;flower<12;flower++){var x=(flower*197+80)%W,y=gy+30+(flower%3)*22;s+=line(x,y,x,y-14,'#729A7D',2)+ell(x,y-16,4,4,flower%2?'#F4D997':'#EAC2AC');}
      }
      s+=rect(0,0,W,gy,'url(#bf-room-light)')+rect(0,0,W,H,'url(#bf-paper-grain)')+'</g>';
    });
    return s;
  }
  BF.World={backdrops:backdrops};
})(BF);
