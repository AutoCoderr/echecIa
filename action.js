/*function callbackAction(success, coupSpecial) {
    choicedCases = [];
    if (!success) {
        document.getElementById("msg").innerHTML = "<font color='red'>Mouvement impossible</font>";
        return;
    }
    document.getElementById("msg").innerHTML = "";
    if (echecEtMat(echec,currentPlayer)) {
        document.getElementById("msg").innerHTML = "<strong>Partie terminée</strong><br/>"+
                                                   "gagnant : joueur <font color='"+(currentPlayer == 1 ? "green" : "red")+"'>"+(currentPlayer == 1 ? 2 : 1)+"</font><br/>"+
                                                   "perdant : joueur <font color='"+(currentPlayer == 1 ? "red" : "green")+"'>"+currentPlayer+"</font>";
        playing = false;
        return;
    }
    if (typeof(coupSpecial) == "object") {
        let selectReponse = "<select id='rep'>";
        for (let i=0;i<coupSpecial.reponses.length;i++) {
            selectReponse += "<option value='"+coupSpecial.reponses[i]+"'>"+coupSpecial.reponses[i]+"</option>";
        }
        selectReponse += "</select>";

        $(".modal-title").html("Choisissez");
        $(".modal-body").html(coupSpecial.msg+" : "+selectReponse+"<br/><input type='button' value='Valider' onclick='choiceModal()'/>");

        $(".modal").modal("toggle");

        functionCoupSpecial = coupSpecial.func;
        return;
    }

    if (isEchec(currentPlayer,echec)) {
        document.getElementById("msg").innerHTML = "<font color='red'>Vous êtes en echec</font>";
    }

    currentPlayer = (currentPlayer == 1 ? 2 : 1);
    document.getElementById("whoPlayer").innerHTML = "C'est au joueur <font color='"+(currentPlayer == 1 ? "red" : "green")+"'>"+currentPlayer+"</font>";

}*/
let lastDeplacment = {};
async function action(A, B, echecb = echec, currentPlayerb = currentPlayer, scorePlayersb = scorePlayers, infosCaseb = infosCase) {
    //console.log("action");
    //console.log(scorePlayersb);

    if (A == null | B == null) {
        return {success: false};
    }

    const lA = A.l, cA = A.c, lB = B.l, cB = B.c;

    if (!possibleMouvement(lA, cA, lB, cB, echecb, currentPlayerb, infosCaseb)) {
        return {success: false};
    }
    let thisInfoCase;

    thisInfoCase = getInfoCase(lA,cA,infosCaseb);
    if (thisInfoCase != null) {
        thisInfoCase.nb += 1;
    }
    let cD, lD, lI, cI;
    let listMouv;
    switch(Math.floor(echecb[A.l][A.c]/10)) {
        case 1: //pion
            if (cB > cA) {
                cD = 1;
            } else if (cB < cA) {
                cD = -1;
            } else {
                cD = 0;
            }
            if (lB > lA) {
                lD = 1;
            } else if (lB < lA) {
                lD = -1;
            } else {
                lD = 0;
            }
            listMouv = [];
            lI = lA;
            cI = cA;
            while (lI != lB | cI != cB) {
                lI += lD;
                cI += cD;
                listMouv.push({l: lI, c: cI});
            }
            await deplace(lA,cA,listMouv,echecb,10+currentPlayerb,scorePlayersb,infosCaseb,currentPlayerb);
            const lP = listMouv[listMouv.length-1].l;
            const cP = listMouv[listMouv.length-1].c;
            if (listMouv[0].c != cA &
                ((currentPlayerb == 1 & getElem(echecb,lP+1,cP)%10 == 2 & getInfoCase(lP+1,cP,infosCaseb).isLastDeplacment & getInfoCase(lP+1,cP,infosCaseb).justTwoDeplacment) |
                (currentPlayerb == 2 & getElem(echecb,lP-1,cP)%10 == 1 & getInfoCase(lP-1,cP,infosCaseb).isLastDeplacment & getInfoCase(lP-1,cP,infosCaseb).justTwoDeplacment))) {
                if (currentPlayerb == 1) {
                    scorePlayersb[echecb[lP+1][cP]%10][Math.floor(echecb[lP+1][cP]/10)] -= 1;
                    echecb[lP+1][cP] = 0;
                } else if (currentPlayerb == 2) {
                    scorePlayersb[echecb[lP-1][cP]%10][Math.floor(echecb[lP-1][cP]/10)] -= 1;
                    echecb[lP-1][cP] = 0;
                }
                if (!simule) {
                    displayEchec();
                }
            }
            thisInfoCase = getInfoCase(lB,cB,infosCaseb);
            thisInfoCase.isLastDeplacment = true;
            for (let i=0;i<infosCase.length;i++) {
                if (infosCaseb[i].l != lB & infosCaseb[i].c != cB & infosCaseb[i].isLastDeplacment) {
                    infosCaseb[i].isLastDeplacment = false;
                }
            }

            if (Math.sqrt((lB-lA)**2) == 2) {
                thisInfoCase.justTwoDeplacment = true;
            } else {
                thisInfoCase.justTwoDeplacment = false;
            }

            if ((currentPlayerb == 1 & lB == 0) | (currentPlayerb == 2 & lB == 7)) {
                return {success: true, coupSpecial: {
                    func: (rep,infosCaseb = infosCase,scorePlayersb = scorePlayers,currentPlayerb = currentPlayer,echecb = echec,simule = false) => {
                        promotion(lB,cB,infosCaseb,scorePlayersb,currentPlayerb,echecb,simule,rep);
                    }, msg: "Par quoi voulez vous remplacer ce pion?", reponses: ["Cavalier","Tour","Fou","Reine"], name: "promotion"}
                };
            }
            lastDeplacment = {lA: lA, cA: cA, lB: lB, cB: cB};
            //console.log(scorePlayersb);
            return {success: true};
        case 2: //cavalier
            listMouv = [];
            if ((lB-lA)**2 == 1) {
                if (cB < cA) {
                    listMouv.push({l: lA, c: cA-1});
                } else {
                    listMouv.push({l: lA, c: cA+1});
                }
                listMouv.push({l: lA, c: cB});
                listMouv.push({l: lB, c: cB});
            } else if ((cB-cA)**2 == 1) {
                if (lB < lA) {
                    listMouv.push({l: lA-1, c: cA});
                } else {
                    listMouv.push({l: lA+1, c: cA});
                }
                listMouv.push({l: lB, c: cA})
                listMouv.push({l: lB, c: cB});
            }
            await deplace(lA,cA,listMouv,echecb,20+currentPlayerb,scorePlayersb,infosCaseb,currentPlayerb);
            thisInfoCase = getInfoCase(lB,cB,infosCaseb);
            thisInfoCase.isLastDeplacment = true;
            for (let i=0;i<infosCaseb.length;i++) {
                if (infosCaseb[i].l != lB & infosCaseb[i].c != cB & infosCaseb[i].isLastDeplacment) {
                    infosCaseb[i].isLastDeplacment = false;
                }
            }
            lastDeplacment = {lA: lA, cA: cA, lB: lB, cB: cB};
            //console.log(scorePlayersb);
            return {success: true};
        case 3: //tour
            if (cB != cA) {
                lD = 0;
                if (cB > cA) {
                    cD = 1;
                } else {
                    cD = -1;
                }
            } else if (lB != lA) {
                cD = 0;
                if (lB > lA) {
                    lD = 1;
                } else {
                    lD = -1;
                }
            }
            listMouv = [];
            lI = lA;
            cI = cA;
            while (lI != lB | cI != cB) {
                lI += lD;
                cI += cD;
                listMouv.push({l: lI, c: cI});
            }
            await deplace(lA,cA,listMouv,echecb,30+currentPlayerb,scorePlayersb,infosCaseb,currentPlayerb);
            thisInfoCase = getInfoCase(lB,cB,infosCaseb);
            thisInfoCase.isLastDeplacment = true;
            for (let i=0;i<infosCaseb.length;i++) {
                if (infosCaseb[i].l != lB & infosCaseb[i].c != cB & infosCaseb[i].isLastDeplacment) {
                    infosCaseb[i].isLastDeplacment = false;
                }
            }
            if (thisInfoCase.nb == 1 ) {
                if (echecb[lB][cB-1] == 60+currentPlayerb & getInfoCase(lB,cB-1,infosCaseb).nb == 0) {
                    return {success: true, coupSpecial: {
                        func: (rep,infoCaseb = infosCase,scorePlayersb = scorePlayers,currentPlayerb = currentPlayer,echecb = echec,simule = false) => {
                            roque(lB,cB,lB,cB-1,infosCaseb,scorePlayersb,currentPlayerb,echecb,simule,rep);
                        }, msg: "Effectuer un roque?", reponses: ["oui","non"], name: "roque"}
                    };
                } else if (echecb[lB][cB+1] == 60+currentPlayerb & getInfoCase(lB,cB+1,infosCaseb).nb == 0) {
                    return {success: true, coupSpecial: {
                        func: (rep,infoCaseb = infosCase,scorePlayersb = scorePlayers,currentPlayerb = currentPlayer,echecb = echec,simule = false) => {
                            roque(lB,cB,lB,cB+1,infosCaseb,scorePlayersb,currentPlayerb,echecb,simule,rep);
                        }, msg: "Effectuer un roque?", reponses: ["oui","non"], name: "roque"}
                    };
                }
            }
            lastDeplacment = {lA: lA, cA: cA, lB: lB, cB: cB};
            //console.log(scorePlayersb);
            return {success: true};
        case 4: // fou
            lD = 0;
            cD = 0;
            if (lB > lA) {
                lD = 1;
            } else if (lB < lA) {
                lD = -1;
            }
            if (cB > cA) {
                cD = 1
            } else if (cB < cA) {
                cD = -1;
            }
            listMouv = [];
            lI = lA;
            cI = cA;
            while (lI != lB | cI != cB) {
                lI += lD;
                cI += cD;
                listMouv.push({l: lI, c: cI});
            }
            await deplace(lA,cA,listMouv,echecb,40+currentPlayerb,scorePlayersb,infosCaseb,currentPlayerb);
            thisInfoCase = getInfoCase(lB,cB,infosCaseb);
            thisInfoCase.isLastDeplacment = true;
            for (let i=0;i<infosCaseb.length;i++) {
                if (infosCaseb[i].l != lB & infosCaseb[i].c != cB & infosCaseb[i].isLastDeplacment) {
                    infosCaseb[i].isLastDeplacment = false;
                }
            }
            lastDeplacment = {lA: lA, cA: cA, lB: lB, cB: cB};
            //console.log(scorePlayersb);
            return {success: true};
        case 5: // reine
            lD = 0;
            cD = 0;
            if (lB > lA) {
                lD = 1;
            } else if (lB < lA) {
                lD = -1;
            }
            if (cB > cA) {
                cD = 1
            } else if (cB < cA) {
                cD = -1;
            }
            listMouv = [];
            lI = lA;
            cI = cA;
            while (lI != lB | cI != cB) {
                lI += lD;
                cI += cD;
                listMouv.push({l: lI, c: cI});
            }
            await deplace(lA,cA,listMouv,echecb,50+currentPlayerb,scorePlayersb,infosCaseb,currentPlayerb);
            thisInfoCase = getInfoCase(lB,cB,infosCaseb);
            thisInfoCase.isLastDeplacment = true;
            for (let i=0;i<infosCaseb.length;i++) {
                if (infosCaseb[i].l != lB & infosCaseb[i].c != cB & infosCaseb[i].isLastDeplacment) {
                    infosCaseb[i].isLastDeplacment = false;
                }
            }
            lastDeplacment = {lA: lA, cA: cA, lB: lB, cB: cB};
            //console.log(scorePlayersb);
            return {success: true};
        case 6: // roi
            listMouv = [{l: lB, c: cB}];
            await deplace(lA,cA,listMouv,echecb,60+currentPlayerb,scorePlayersb,infosCaseb,currentPlayerb);
            thisInfoCase = getInfoCase(lB,cB,infosCaseb);
            thisInfoCase.isLastDeplacment = true;
            for (let i=0;i<infosCaseb.length;i++) {
                if (infosCaseb[i].l != lB & infosCaseb[i].c != cB & infosCaseb[i].isLastDeplacment) {
                    infosCaseb[i].isLastDeplacment = false;
                }
            }
            lastDeplacment = {lA: lA, cA: cA, lB: lB, cB: cB};
            return {success: true};
    }

}

async function deplace(lP,cP,listMouv,echecb,type,scorePlayersb,infosCaseb,currentPlayerb) {
    for (let i=0;i<listMouv.length;i++) {
        if (echecb[listMouv[i].l][listMouv[i].c] != 0) {
            if (Math.floor(type/10) == 1 & listMouv[i].c == cP) {
                //return {echec: echecb, scorePlayers: scorePlayersb, infosCase: infosCaseb};
                return;
            } else if (Math.floor(type/10) != 2 | i == listMouv.length-1) {
                if (echecb[listMouv[i].l][listMouv[i].c]%10 != currentPlayerb & echecb[listMouv[i].l][listMouv[i].c] != 0) {
                    scorePlayersb[echecb[listMouv[i].l][listMouv[i].c]%10][Math.floor(echecb[listMouv[i].l][listMouv[i].c]/10)] -= 1;
                    let thisInfoCase = getInfoCase(lP,cP,infosCaseb);
                    thisInfoCase.l = listMouv[i].l;
                    thisInfoCase.c = listMouv[i].c;
                    echecb[lP][cP] = 0;
                    echecb[listMouv[i].l][listMouv[i].c] = type;
                    //return {echec: echecb, scorePlayers: scorePlayersb, infosCase: infosCaseb};
                }
                return;
            }
        } else {
            echecb[lP][cP] = 0;
            echecb[listMouv[i].l][listMouv[i].c] = type;
            let thisInfoCase = getInfoCase(lP,cP,infosCaseb);
            thisInfoCase.l = listMouv[i].l;
            thisInfoCase.c = listMouv[i].c;
            lP = listMouv[i].l;
            cP = listMouv[i].c;
        }
    }
}
function deplaceRec(callback,lP,cP,listMouv,type, echecb, scorePlayersb, infosCaseb, currentPlayerb, i = 0, simule = false) {
    if (i >= listMouv.length) {
            if (typeof(callback) == "function") {
                callback();
            }
            return;
    }
    if (echecb[listMouv[i].l][listMouv[i].c] != 0) {
        if (Math.floor(type/10) == 2 & i < listMouv.length-1) {
            deplaceRec(callback,lP,cP,listMouv,type,echecb,scorePlayersb,infosCaseb,currentPlayerb,i+1,simule);
        } else if (Math.floor(type/10) == 1 & listMouv[i].c == cP) {
            if (!simule)  {
                displayEchec();
            }
            if (typeof(callback) == "function") {
                callback();
            }
        } else {
            if (echecb[listMouv[i].l][listMouv[i].c]%10 != currentPlayerb) {
                scorePlayersb[echecb[listMouv[i].l][listMouv[i].c]%10][Math.floor(echecb[listMouv[i].l][listMouv[i].c]/10)] -= 1;
                echecb[lP][cP] = 0;
                echecb[listMouv[i].l][listMouv[i].c] = type;
                let thisInfoCase = getInfoCase(lP,cP,infosCaseb);
                thisInfoCase.l = listMouv[i].l;
                thisInfoCase.c = listMouv[i].c;
                if (!simule)  {
                    displayEchec();
                }
            }
            if (typeof(callback) == "function") {
                callback();
            }
        }
        return;
    }
    echecb[lP][cP] = 0;
    echecb[listMouv[i].l][listMouv[i].c] = type;
    let thisInfoCase = getInfoCase(lP,cP,infosCaseb);
    thisInfoCase.l = listMouv[i].l;
    thisInfoCase.c = listMouv[i].c;
    if (!simule) {
        displayEchec();
    }
    if (simule) {
        deplaceRec(callback,listMouv[i].l,listMouv[i].c,listMouv,type,echecb,scorePlayersb,infosCaseb,currentPlayerb,i+1,simule);
    } else {
        setTimeout(() => {
            deplaceRec(callback,listMouv[i].l,listMouv[i].c,listMouv,type,echecb,scorePlayersb,infosCaseb,currentPlayerb,i+1,simule);
        }, 500);
    }
}

function possibleMouvement(lA,cA,lB,cB, echecb, currentPlayerb, infosCaseb) {
    if (echecb[lA][cA] == 0 | echecb[lA][cA]%10 != currentPlayerb) {
        return false;
    }
    if (lA == lB & cA == cB) {
        return false;
    }

    switch(Math.floor(echecb[lA][cA]/10)) {
        case 1: // pion
            if (lB == lA & cB == cA) {
                return false;
            }
            if ((currentPlayerb == 1 & (lB != lA-1 | cB != cA | (echecb[lB][cB] != 0 & cB == cA))) |
                (currentPlayerb == 2 & (lB != lA+1 | cB != cA | (echecb[lB][cB] != 0 & cB == cA)))) { // deplacement en ligne droite
                if ((currentPlayerb == 1 & ( ( (lB == lA-1 & (cB-cA)**2 == 1) & echecb[lB][cB]%10 != 2 & (getElem(echecb,lB+1,cB)%10 != 2 | !getInfoCase(lB+1,cB,infosCase).isLastDeplacment | !getInfoCase(lB+1,cB,infosCase).justTwoDeplacment) | echecb[lB][cB]%10 == 1) | (lB == lA-2 & (getInfoCase(lA,cA,infosCase).nb > 0 | Math.sqrt((cB-cA)**2) == 2)) | (lB != lA-1 & lB != lA-2) | (lB == lA-1 & cB != cA-1 & cB != cA+1) | (echecb[lB][cB] != 0 & cB == cA))) |
                    (currentPlayerb == 2 & ( ( (lB == lA+1 & (cB-cA)**2 == 1) & echecb[lB][cB]%10 != 1 & (getElem(echecb,lB-1,cB)%10 != 1 | !getInfoCase(lB-1,cB,infosCase).isLastDeplacment | !getInfoCase(lB-1,cB,infosCase).justTwoDeplacment) | echecb[lB][cB]%10 == 2) | (lB == lA+2 & (getInfoCase(lA,cA,infosCase).nb > 0 | Math.sqrt((cB-cA)**2) == 2)) | (lB != lA+1 & lB != lA+2) | (lB == lA+1 & cB != cA-1 & cB != cA+1) | (echecb[lB][cB] != 0 & cB == cA)))) {
                    return false;
                }
            }
            break;
        case 2: // cavalier
            if (lB == lA & cB == cA) {
                return false;
            }
            if (echecb[lB][cB]%10 == currentPlayerb) {
                return false;
            }
            if (Math.sqrt((lB-lA)**2) == 2) {
                if (cB != cA+1 & cB != cA-1) {
                    return false;
                }
            } else if (Math.sqrt((cB-cA)**2) == 2) {
                if (lB != lA-1 & lB != lA+1) {
                    return false;
                }
            } else {
                return false;
            }
            break;
        case 3: // tour
            if ((lB != lA & cB != cA) | (lB == lA & cB == cA)) {
                return false;
            }
            if (echecb[lB][cB]%10 == currentPlayerb) {
                return false;
            }
            break;
        case 4: //fou
            if (lB == lA & cB == cA) {
                return false;
            }
            if (echecb[lB][cB]%10 == currentPlayerb) {
                return false;
            }
            if (Math.sqrt((lB-lA)**2) != Math.sqrt((cB-cA)**2)) {
                return false;
            }
            break;
        case 5: //reine
            if (lB == lA & cB == cA) {
                return false;
            }
            if (echecb[lB][cB]%10 == currentPlayerb) {
                return false;
            }
            if ((Math.sqrt((lB-lA)**2) != Math.sqrt((cB-cA)**2)) &
                (lB != lA & cB != cA)) {
                return false;
            }
            break;
        case 6: //roi
            if (lB == lA & cB == cA) {
                return false;
            }
            if (echecb[lB][cB]%10 == currentPlayerb) {
                return false;
            }
            if ((lB-lA)**2 > 1 | (cB-cA)**2 > 1) {
                return false;
            }
            break;
    }
    let echecbb = copyObj(echecb);
    echecbb[lB][cB] = echecbb[lA][cA];
    echecbb[lA][cA] = 0;
    if (isEchec(currentPlayerb,echecbb)) {
         return false;
    }
    return true;
}

function getInfoCase(l,c,infosCase) {
    for (let i=0;i<infosCase.length;i++) {
        if (infosCase[i].l == l & infosCase[i].c == c) {
            return infosCase[i];
        }
    }
    let emptyObject = {};
    for (let keyA in dataInfoCase) {
        for (let keyB in dataInfoCase[keyA]) {
            emptyObject[keyB] = dataInfoCase[keyA][keyB];
        }
    }
    return emptyObject;
}

function caseNameToCoor(cellName) {
    if (typeof(cellName) != "string") {
        console.log("ERROR => caseNameToCoor : cellName not a string");
        return;
    }
    if (cellName.length != 2) {
        console.log("ERROR => caseNameToCoor : cellName bad length");
        return;
    }
    const letterToNum = {a: 0, A: 0, b: 1, B: 1, c: 2, C: 2, d: 3, D: 3, e: 4, E: 4, f: 5, F: 5, g: 6, G: 6, h: 7, H: 7};

    if (typeof(letterToNum[cellName[0]]) == "undefined") {
        console.log("ERROR => caseNameToCoor : bad letter");
        return;
    }

    if (parseInt(cellName[1]) < 1 | parseInt(cellName[1]) > 8) {
        console.log("ERROR => caseNameToCoor : incorrect line Number");
        return;
    }

    return {l: 8-parseInt(cellName[1]), c: letterToNum[cellName[0]]};
}

function isEchec(currentPlayer,echec) {
    for (let l=0;l<echec.length;l++) {
        for (let c=0;c<echec[l].length;c++) {
            if (echec[l][c]%10 != currentPlayer & echec[l][c] != 0) {
                let mouvs = getPath(l,c,echec);
                for (let i=0;i<mouvs.length;i++) {
                    if (echec[mouvs[i].l][mouvs[i].c] == 60+currentPlayer) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function getPath(l,c,echec) {
    if (echec[l][c] == 0) {
        return [];
    }
    const currentPlayer = echec[l][c]%10;
    const type = Math.floor(echec[l][c]/10);

    let mouvs = [];
    let lB,cB,coefs;
    switch(type) {
        case 1: // pion
            if (currentPlayer == 1 & l-1 >= 0) {
                if (echec[l-1][c] == 0) {
                    mouvs.push({l: l-1, c: c});
                }
                if (c-1 >= 0) {
                    if (echec[l-1][c-1]%10 != currentPlayer) {
                        mouvs.push({l: l-1, c: c-1});
                    }
                }
                if (c+1 < echec[l-1].length) {
                    if (echec[l-1][c+1]%10 != currentPlayer) {
                        mouvs.push({l: l-1, c: c+1});
                    }
                }
            } else if (currentPlayer == 2 & l+1 < echec.length) {
                if (echec[l+1][c] == 0) {
                    mouvs.push({l: l+1, c: c});
                }
                if (c-1 >= 0) {
                    if (echec[l+1][c-1]%10 != currentPlayer) {
                        mouvs.push({l: l+1, c: c-1});
                    }
                }
                if (c+1 < echec[l+1].length) {
                    if (echec[l+1][c+1]%10 != currentPlayer) {
                        mouvs.push({l: l+1, c: c+1});
                    }
                }
            }
            break;
        case 2: // cavalier
            if (l-2 >= 0) {
                if (c-1 >= 0) {
                    if (echec[l-2][c-1]%10 != currentPlayer) {
                        mouvs.push({l: l-2, c: c-1});
                    }
                }
                if (c+1 < echec[l].length) {
                    if (echec[l-2][c+1]%10 != currentPlayer) {
                        mouvs.push({l: l-2, c: c+1});
                    }
                }
            }
            if (l+2 < echec.length) {
                if (c-1 >= 0) {
                    if (echec[l+2][c-1]%10 != currentPlayer) {
                        mouvs.push({l: l+2, c: c-1});
                    }
                }
                if (c+1 < echec[l].length) {
                    if (echec[l+2][c+1]%10 != currentPlayer) {
                        mouvs.push({l: l+2, c: c+1});
                    }
                }
            }
            if (c-2 >= 0) {
                if (l-1 >= 0) {
                    if (echec[l-1][c-2]%10 != currentPlayer) {
                        mouvs.push({l: l-1, c: c-2});
                    }
                }
                if (l+1 < echec.length) {
                    if (echec[l+1][c-2]%10 != currentPlayer) {
                        mouvs.push({l: l+1, c: c-2});
                    }
                }
            }
            if (c+2 < echec[l].length) {
                if (l-1 >= 0) {
                    if (echec[l-1][c+2]%10 != currentPlayer) {
                        mouvs.push({l: l-1, c: c+2});
                    }
                }
                if (l+1 < echec.length) {
                    if (echec[l+1][c+2]%10 != currentPlayer) {
                        mouvs.push({l: l+1, c: c+2});
                    }
                }
            }
            break;
        case 3: // tour
            lB = l-1;

            while (lB >= 0) {
                if (echec[lB][c]%10 == currentPlayer) {
                    break;
                }
                if (lB < echec.length-1) {
                    if (echec[lB+1][c]%10 == (currentPlayer == 1 ? 2 : 1)) {
                        break;
                    }
                }
                mouvs.push({l: lB, c: c});
                lB -= 1;
            }
            lB = l+1;
            while (lB < echec.length) {
                if (echec[lB][c]%10 == currentPlayer) {
                    break;
                }
                if (lB > 0) {
                    if (echec[lB-1][c]%10 == (currentPlayer == 1 ? 2 : 1)) {
                        break;
                    }
                }
                mouvs.push({l: lB, c: c});
                lB += 1;
            }
            cB = c-1;
            while (cB >= 0) {
                if (echec[l][cB]%10 == currentPlayer) {
                    break;
                }
                if (cB < echec[0].length-1) {
                    if (echec[l][cB+1]%10 == (currentPlayer == 1 ? 2 : 1)) {
                        break;
                    }
                }
                mouvs.push({l: l, c: cB});
                cB -= 1;
            }
            cB = c+1;
            while (cB < echec[l].length) {
                if (echec[l][cB]%10 == currentPlayer) {
                    break;
                }
                if (cB > 0) {
                    if (echec[l][cB-1]%10 == (currentPlayer == 1 ? 2 : 1)) {
                        break;
                    }
                }
                mouvs.push({l: l, c: cB});
                cB += 1;
            }
            break;
        case 4: //fou
            coefs = [{coefL: -1, coefC: -1},{coefL: -1, coefC: 1}, {coefL: 1, coefC: -1}, {coefL: 1, coefC: 1}];

            for (let i=0;i<coefs.length;i++) {
                const coefL = coefs[i].coefL;
                const coefC = coefs[i].coefC;
                lB = l+coefL;
                cB = c+coefC;
                while (lB >= 0 & lB < echec.length & cB >= 0 & cB < echec[0].length) {
                    if (echec[lB][cB]%10 == currentPlayer) {
                        break;
                    }
                    if (lB+coefL*(-1) >= 0 & lB+coefL*(-1) < echec.length & cB+coefC*(-1) >= 0 & cB+coefC*(-1) < echec[0].length) {
                        if (echec[lB+coefL*(-1)][cB+coefC*(-1)]%10 == (currentPlayer == 1 ? 2 : 1)) {
                            break;
                        }
                    }
                    mouvs.push({l: lB, c: cB});
                    lB += coefL;
                    cB += coefC;
                }
            }
            break;
        case 5: //reine
            coefs = [{coefL: -1, coefC: -1},{coefL: -1, coefC: 1}, {coefL: 1, coefC: -1}, {coefL: 1, coefC: 1},
                         {coefL: -1, coefC: 0},{coefL: 1, coefC: 0},{coefL: 0, coefC: -1},{coefL: 0, coefC: 1}];

            for (let i=0;i<coefs.length;i++) {
                const coefL = coefs[i].coefL;
                const coefC = coefs[i].coefC;
                lB = l+coefL;
                cB = c+coefC;
                while (lB >= 0 & lB < echec.length & cB >= 0 & cB < echec[0].length) {
                    if (echec[lB][cB]%10 == currentPlayer) {
                        break;
                    }
                    if (lB+coefL*(-1) >= 0 & lB+coefL*(-1) < echec.length & cB+coefC*(-1) >= 0 & cB+coefC*(-1) < echec[0].length) {
                        if (echec[lB+coefL*(-1)][cB+coefC*(-1)]%10 == (currentPlayer == 1 ? 2 : 1)) {
                            break;
                        }
                    }
                    mouvs.push({l: lB, c: cB});
                    lB += coefL;
                    cB += coefC;
                }
            }
            break;
        case 6: // roi
            coefs = [{coefL: -1, coefC: -1},{coefL: -1, coefC: 1}, {coefL: 1, coefC: -1}, {coefL: 1, coefC: 1},
                         {coefL: -1, coefC: 0},{coefL: 1, coefC: 0},{coefL: 0, coefC: -1},{coefL: 0, coefC: 1}];
            for (let i=0;i<coefs.length;i++) {
                const coefL = coefs[i].coefL;
                const coefC = coefs[i].coefC;
                lB = l+coefL;
                cB = c+coefC;
                if (lB >= 0 & lB < echec.length & cB >= 0 & cB < echec[0].length) {
                    if (echec[lB][cB]%10 != currentPlayer) {
                        mouvs.push({l: lB, c: cB});
                    }
                }
            }
            break;
    }
    return mouvs;
}

function echecEtMat(echec,currentPlayer) {
    if (!isEchec(currentPlayer,echec)) {
        return false;
    }

    for (let l=0;l<echec.length;l++) {
        for (let c=0;c<echec[l].length;c++) {
            if (echec[l][c]%10 == currentPlayer) {
                let mouvs = getPath(l,c,echec);
                for (let i=0;i<mouvs.length;i++) {
                    let echecb = copyObj(echec);
                    echecb[mouvs[i].l][mouvs[i].c] = echecb[l][c];
                    echecb[l][c] = 0;
                    if (!isEchec(currentPlayer,echecb)) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

function promotion(l,c,infosCase,scorePlayers,currentPlayerb,echec,simule,rep,callback) {
    if (rep == "Cavalier") {
        scorePlayers[currentPlayerb][2] += 1;
        echec[l][c] = 20+currentPlayerb;
        scorePlayers[currentPlayerb][1] -= 1;
    } else if (rep == "Tour") {
        scorePlayers[currentPlayerb][3] += 1;
        echec[l][c] = 30+currentPlayerb;
        scorePlayers[currentPlayerb][1] -= 1;
    } else if (rep == "Fou") {
        scorePlayers[currentPlayerb][4] += 1;
        echec[l][c] = 40+currentPlayerb;
        scorePlayers[currentPlayerb][1] -= 1;
    } else if (rep == "Reine") {
        scorePlayers[currentPlayerb][5] += 1;
        echec[l][c] = 50+currentPlayerb;
        scorePlayers[currentPlayerb][1] -= 1;
    }
    if (callback == null & !simule) {
        currentPlayer = (currentPlayer == 1 ? 2 : 1);
        document.getElementById("whoPlayer").innerHTML = "C'est au joueur <font color='"+(currentPlayer == 1 ? "red" : "green")+"'>"+currentPlayer+"</font>";
        displayEchec();
    } else if (callback != null){
        callback(echec,infosCase,scorePlayers)
    }
    functionCoupSpecial = null;
}
function roque(lT,cT,lR,cR,infosCase,scorePlayers,currentPlayerb,echec,simule,rep,callback) {
    /*if (!simule) {
        console.log("roque");
        console.log("rep => "+rep);
    }*/
    if (rep == "oui") {
        let thisInfoCase = getInfoCase(lR,cR,infosCase);
        if (cT == cR+1) {
            thisInfoCase.c = cT+1;
            echec[lR][cR] = 0;
            echec[lR][cT+1] = 60+currentPlayer;
        } else if (cT == cR-1) {
            thisInfoCase.c = cT-1;
            echec[lR][cR] = 0;
            echec[lR][cT-1] = 60+currentPlayer;
        }
    }
    if (callback == null & !simule) {
        currentPlayer = (currentPlayer == 1 ? 2 : 1);
        document.getElementById("whoPlayer").innerHTML = "C'est au joueur <font color='"+(currentPlayer == 1 ? "red" : "green")+"'>"+currentPlayer+"</font>";
        displayEchec();
    } else if (callback != null) {
        callback(echec,infosCase,scorePlayers)
    }
}

function getElem(echec,l,c) {
    if (typeof(echec[l]) == "undefined") {
        return 0;
    }
    if (typeof(echec[l][c]) == "undefined") {
        return 0;
    }
    return echec;
}

function copyTab(tab) {
    let tab2 = [];
    for (let i=0;i<tab.length;i++) {
        if (typeof(tab[i]) != "object") {
            tab2.push(tab[i]);
        } else {
            tab2.push(copyObj(tab[i]));
        }
    }
    return tab2;
}

function copyObj(obj) {
    if (Array.isArray(obj)) {
        return copyTab(obj);
    } else {
        return copyDict(obj);
    }
}

function copyDict(dict) {
    let dict2 = {};
    for (let key in dict) {
        if (typeof(dict[key]) != "object") {
            dict2[key] = dict[key];
        } else {
            dict2[key] = copyObj(dict[key]);
        }
    }
    return dict2;
}
