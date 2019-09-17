let iaStarting = false;

function applyIa(profondeurMax = 4) {
    if (!playing) {
        return;
    }
    if (iaStarting) {
        return;
    }
    iaStarting = true;
    let ia = new IA();
    ia.profondeurMax = profondeurMax;
    console.log("Veuillez patienter...");
    ia.startIa(async (A,B,coupSpecial) => {
        console.log(ia.tree);
        console.log("Terminé");
        console.log(ia.taille+" possibilités analysées");
        await applyMouv(A,B);
        delete ia.tree;
        if (coupSpecial != null) {
            console.log("coupSpecial");
            $(".modal").modal("toggle");
            coupSpecial();
        }
        iaStarting = false;
    });
}

function applyIaServ(profondeurMax = 3) {
    if (iaStarting) {
        return;
    }
    iaStarting = true;
    const socket = io.connect('http://80.15.206.192:8000', {'timeout': 10000, 'connect_timeout': 10000});
    console.log("Veuillez patienter...");
    socket.emit("applyIa", {currentPlayer: currentPlayer, echec: echec, scorePlayers: scorePlayers, infosCase: infosCase, profondeurMax: profondeurMax});
    socket.on("reponseIa", async function(datas) {
        console.log("Terminé");
        await applyMouv(datas.A,datas.B);
        if (datas.coupSpecial != null) {
            $(".modal").modal("toggle");
            datas.coupSpecial();
        }
        iaStarting = false;
    });
}

function IA() {
    this.callback = null
    this.tree = null;
    this.profondeurMax = null;
    this.taille = null;

    this.startIa = async function(callback) {
        if (typeof(callback) == "function") {
            this.callback = callback;
        }
        this.taille = 0;
        this.tree = {echec: copyTab(echec), infosCase: copyObj(infosCase), scorePlayers: copyObj(scorePlayers), profondeur: 0};
        console.log("genTree");
        await this.genTree(this.tree);
        //console.log("minMax");
        //await this.minMax(this.tree);
        let max = this.tree.branchs[0];
        for (let i=1;i<this.tree.branchs.length;i++) {
            if (this.tree.branchs[i].score > max.score | 
                (this.tree.branchs[i].score == max.score & Math.random() < 1/2)) {
                max = this.tree.branchs[i];
            }
        }
        if (this.callback != null) {
            this.callback({l: max.lA, c: max.cA},{l: max.lB, c: max.cB},max.coupSpecial);
        }
    }

    this.genTree = async function(tree, profondeur = 0, currentPlayerb = currentPlayer) {
        if (profondeur >= this.profondeurMax) {
            return true;
        }
        if (echecEtMat(tree.echec,1) | echecEtMat(tree.echec,1)) {
            return true;
        }
        let coupureAlphaBeta = false;
        let toGet = null
        tree.branchs = [];
        for (let l=0;l<8;l++) {
            for (let c=0;c<8;c++) {
                if (typeof(tree.branchs) == "undefined") {
                    tree.branchs = [];
                }
                //console.log(profondeur);
                //console.log(l+";"+c);
                let echec = tree.echec;
                //console.log(echec[l][c]);
                let infosCase = tree.infosCase;
                //slet scorePlayers = tree.scorePlayers;
                //console.log(echec);
                if (echec[l][c]%10 == currentPlayerb) {
                    //console.log("if 1");
                    let mouvs = getPath(l,c,echec);
                    for (let i=0;i<mouvs.length;i++) {
                        let echecb = copyObj(echec);
                        let infosCaseb = copyObj(infosCase);
                        let scorePlayersb = copyObj(tree.scorePlayers);
                        //console.log(i);
                        //console.log(mouvs);
                        //console.log("wesh");
                        let datas = await action({l: l, c: c}, {l: mouvs[i].l, c: mouvs[i].c},echecb,currentPlayerb,scorePlayersb,infosCaseb);
                        //console.log("\n");

                        let coupSpecial = datas.coupSpecial, success = datas.success;

                        if (coupSpecial != null) {
                            let reponses = coupSpecial.reponses, func = coupSpecial.func;
                            this.taille += reponses.length;
                            for (let j=0;j<reponses.length;j++) {
                                let echecbb = copyObj(echecb);
                                let infosCasebb = copyObj(infosCaseb);
                                let scorePlayersbb = copyObj(scorePlayersb);

                                await func(reponses[j],infosCasebb,scorePlayersbb,currentPlayerb,echecbb,true);

                                let score = 0;
                                //if (profondeur == this.profondeurMax-1) {
                                    for (let piece in scorePlayers[1]) {
                                        if (piece != 6) { // ce n'est pas le roi
                                            if (scorePlayersbb[1][piece] < scorePlayers[1][piece]) {
                                                score -= scoreObjets[piece];
                                            } else if (scorePlayersbb[1][piece] > scorePlayers[1][piece]) {
                                                score += scoreObjets[piece];
                                            }
                                            if (scorePlayersbb[2][piece] < scorePlayers[2][piece]) {
                                                score += scoreObjets[piece];
                                            } else if (scorePlayersbb[2][piece] > scorePlayers[2][piece]) {
                                                score -= scoreObjets[piece];
                                            }
                                        }
                                    }
                                    if (echecEtMat(echecbb,1)) {
                                        score -= 10000000;
                                    }
                                    if (echecEtMat(echecbb,2)) {
                                        score += 10000000;
                                    }
                                    if (currentPlayer == 2) {
                                        score = score * (-1);
                                    }
                                    if (coupSpecial.name != "roque" | reponses[j] == "non") {
                                        if ((currentPlayer == 1 & ((echec[7][4] == 61 & echecbb[7][4] != 61) | (echec[7][0] == 31 & echecbb[7][0] != 31 & echec[7][7] == 31 & echecbb[7][7] != 31))) |
                                            (currentPlayer == 2 & ((echec[0][4] == 61 & echecbb[0][4] != 61) | (echec[0][0] == 31 & echecbb[0][0] != 31 & echec[0][7] == 31 & echecbb[0][7] != 31)))) {
                                            score -= 1;
                                        } else if (getInfoCase((currentPlayer == 1 ? 7 : 0),4,infosCase).nb == 0 & getInfoCase((currentPlayer == 1 ? 7 : 0),4,infosCasebb).nb > 0 | 
                                                  (getInfoCase((currentPlayer == 1 ? 7 : 0),0,infosCase).nb == 0 & getInfoCase((currentPlayer == 1 ? 7 : 0),0,infosCasebb).nb > 0 & Math.floor(echecbb[(currentPlayer == 1 ? 7 : 0)][0]/10) == 3 &
                                                   getInfoCase((currentPlayer == 1 ? 7 : 0),7,infosCase).nb == 0 & getInfoCase((currentPlayer == 1 ? 7 : 0),7,infosCasebb).nb > 0 & Math.floor(echecbb[(currentPlayer == 1 ? 7 : 0)][7]/10) == 3)) {
                                            score -= 1;
                                        }
                                    }

                                    if (coupSpecial.name == "roque" & reponses[j] == "oui") {
                                        score += 1;
                                    }

                                    /*if (score != 0) {
                                        console.log("profondeur => "+(profondeur+1));
                                        console.log(l+";"+c+" => "+mouvs[i].l+";"+mouvs[i].c);
                                        console.log("score => "+score);
                                        console.log("currentPlayer => "+currentPlayer);
                                        console.log(echecbb);
                                        console.log(scorePlayers);
                                        console.log(scorePlayersbb);
                                        console.log("\n");
                                    }*/
                                //}
                                tree.branchs.push({lA: l, cA: c, lB: mouvs[i].l, cB: mouvs[i].c, coupSpecial: () => {func(reponses[j],infosCase,scorePlayers,currentPlayer,echec,false);}, echec: echecbb, infosCase: infosCasebb, 
                                                   scorePlayers: scorePlayersbb, score: score, profondeur: profondeur+1, parent: tree, nbNode: tree.branchs.length});
                                await this.genTree(tree.branchs[tree.branchs.length-1],profondeur+1,(currentPlayerb == 1 ? 2 : 1));
                                if ((profondeur%2 == 1 & score < toGet) |
                                    (profondeur%2 == 0 & score > toGet) |
                                    toGet == null) {
                                    toGet = score;
                                }
                                if (tree.nbNode > 0) {
                                    for (let n=0;n<tree.nbNode;n++) {
                                        const nodeScore = tree.parent.branchs[n].score;
                                        if ((tree.profondeur%2 == 0 & score >= nodeScore) |
                                            (tree.profondeur%2 == 1 & score < nodeScore)) {
                                            coupureAlphaBeta = true;
                                            //this.taille -= tree.branchs.length-1;
                                            break;
                                        }
                                    }
                                }
                                if (coupureAlphaBeta) {
                                    break;
                                }
                            }
                            if (coupureAlphaBeta) {
                                break;
                            }
                        } else {
                            //console.log(l+";"+c+" to "+mouvs[i].l+";"+mouvs[i].c);
                            if (success) {
                                this.taille += 1;
                                //console.log("success");
                                let score = 0;
                                //if (profondeur == this.profondeurMax-1) {
                                    for (let piece in scorePlayers[1]) {
                                        if (piece != 6) { // ce n'est pas le roi
                                            if (scorePlayersb[1][piece] < scorePlayers[1][piece]) {
                                                score -= scoreObjets[piece];
                                            } else if (scorePlayersb[1][piece] > scorePlayers[1][piece]) {
                                                score += scoreObjets[piece];
                                            }
                                            if (scorePlayersb[2][piece] < scorePlayers[2][piece]) {
                                                score += scoreObjets[piece];
                                            } else if (scorePlayersb[2][piece] > scorePlayers[2][piece]) {
                                                score -= scoreObjets[piece];
                                            }
                                        }
                                    }
                                    if (echecEtMat(echecb,1)) {
                                        score -= 10000000;
                                    }
                                    if (echecEtMat(echecb,2)) {
                                        score += 10000000;
                                    }
                                    if (currentPlayer == 2) {
                                        score = score * (-1);
                                    }
                                    if ((currentPlayer == 1 & ((echec[7][4] == 61 & echecb[7][4] != 61) | (echec[7][0] == 31 & echecb[7][0] != 31 & echec[7][7] == 31 & echecb[7][7] != 31))) |
                                        (currentPlayer == 2 & ((echec[0][4] == 61 & echecb[0][4] != 61) | (echec[0][0] == 31 & echecb[0][0] != 31 & echec[0][7] == 31 & echecb[0][7] != 31)))) {
                                        score -= 2;
                                    } else if (getInfoCase((currentPlayer == 1 ? 7 : 0),4,infosCase).nb == 0 & getInfoCase((currentPlayer == 1 ? 7 : 0),4,infosCaseb).nb > 0 | 
                                              (getInfoCase((currentPlayer == 1 ? 7 : 0),0,infosCase).nb == 0 & getInfoCase((currentPlayer == 1 ? 7 : 0),0,infosCaseb).nb > 0 & Math.floor(echecb[(currentPlayer == 1 ? 7 : 0)][0]/10) == 3 &
                                               getInfoCase((currentPlayer == 1 ? 7 : 0),7,infosCase).nb == 0 & getInfoCase((currentPlayer == 1 ? 7 : 0),7,infosCaseb).nb > 0 & Math.floor(echecb[(currentPlayer == 1 ? 7 : 0)][7]/10) == 3)) {
                                        score -= 2;
                                    }
                                //}
                                /*if (score != 0) {
                                    console.log("profondeur => "+(profondeur+1));
                                    console.log(l+";"+c+" => "+mouvs[i].l+";"+mouvs[i].c);
                                    console.log("score => "+score);
                                    console.log("currentPlayer => "+currentPlayer);
                                    console.log(echecb);
                                    console.log(scorePlayers);
                                    console.log(scorePlayersb);
                                    console.log("\n");
                                }*/
                                tree.branchs.push({lA: l, cA: c, lB: mouvs[i].l, cB: mouvs[i].c, echec: echecb, infosCase: infosCaseb, 
                                                   scorePlayers: scorePlayersb, score: score, profondeur: profondeur+1, parent: tree, coupSpecial: null, nbNode: tree.branchs.length});
                                await this.genTree(tree.branchs[tree.branchs.length-1],profondeur+1,(currentPlayerb == 1 ? 2 : 1));
                                if ((profondeur%2 == 1 & score < toGet) |
                                    (profondeur%2 == 0 & score > toGet) |
                                    toGet == null) {
                                    toGet = score;
                                }
                                if (tree.nbNode > 0) {
                                    for (let n=0;n<tree.nbNode;n++) {
                                        const nodeScore = tree.parent.branchs[n].score;
                                        if ((tree.profondeur%2 == 0 & score >= nodeScore) |
                                            (tree.profondeur%2 == 1 & score < nodeScore)) {
                                            coupureAlphaBeta = true;
                                            //this.taille -= tree.branchs.length-1;
                                            break;
                                        }
                                    }
                                }
                                if (coupureAlphaBeta) {
                                    break;
                                }
                            } else {
                                //console.log("failed");
                            }
                        }
                    }
                } else {
                    //console.log("if 2");
                }
            }
            if (coupureAlphaBeta) {
                break;
            }
        }
        tree.score = toGet;
        return true;
    }
}

const scoreObjets = {
    1: 1, // pion
    2: 3, // cavalier
    3: 5, // tour
    4: 3, // fou
    5: 9 // reine
}