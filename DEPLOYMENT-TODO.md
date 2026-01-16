# Discord Bot Deployment TODO

## Docker Compose på Ubuntu Server

### Förutsättningar
- [ ] Ubuntu-server med Docker och Docker Compose installerat
- [ ] Domän/IP-adress för servern
- [ ] Discord bot-token och klient-ID

### Deployment-steg

1. **Serverinstallation**
   - [ ] Installera Docker: `sudo apt update && sudo apt install docker.io docker-compose`
   - [ ] Lägg till användare i docker-gruppen: `sudo usermod -aG docker $USER`
   - [ ] Starta om servern

2. **Ladda upp bot-filer**
   - [ ] Kopiera bot-filer till servern (via git clone, scp eller rsync)
   - [ ] Navigera till bot-katalogen

3. **Miljökonfiguration**
   - [ ] Skapa `.env`-fil med:
     ```
     DISCORD_TOKEN=din_bot_token_här
     CLIENT_ID=1460365779642875904
     ```

4. **Deploya med Docker Compose**
   - [ ] Kör: `docker-compose up -d`
   - [ ] Kontrollera loggar: `docker-compose logs -f`
   - [ ] Verifiera att botten är online i Discord

5. **Underhållskommandon**
   - [ ] Visa loggar: `docker-compose logs discord-bot`
   - [ ] Starta om bot: `docker-compose restart discord-bot`
   - [ ] Uppdatera bot: `docker-compose down && docker-compose up -d --build`
   - [ ] Stoppa bot: `docker-compose down`

### Filer redo för deployment
- ✅ Dockerfile
- ✅ docker-compose.yml
- ✅ .gitignore
- ✅ Bot-källkod
- ✅ Databasinställning

### Alternativa alternativ (om Docker inte fungerar)
- [ ] Railway.app (gratis nivå)
- [ ] Render.com (gratis nivå)
- [ ] DigitalOcean App Platform
- [ ] AWS EC2 med PM2