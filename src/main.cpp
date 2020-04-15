#include <EasyButton.h>
#include <LinkedList.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>
#include <esp_now.h>

enum defaultChars {
  lcd_setaEsq = B0111111,
  lcd_setaDir = B01111110,
  lcd_pontoCentro = B10100101,
};

enum Buttons {
  BTN_NONE = 0,
  BTN_UP = 17,
  BTN_DOWN = 18,
  BTN_LEFT = 23,
  BTN_RIGHT = 5,
  BTN_CANCEL = 4,
  BTN_ACCEPT = 15
};

byte customChar[] = {B00000, B00000, B00000, B01110,
                     B01110, B00000, B00000, B00000};

class Menu {
public:
  String name = "";
  void *function = NULL;
  LinkedList<Menu *> MenuItens = LinkedList<Menu *>();

  Menu(String _name) { name = _name; }
};

// Inicializa o display no endereco 0x27
LiquidCrystal_I2C lcd(0x3F, 2, 1, 0, 4, 5, 6, 7, 3, POSITIVE);

EasyButton upBtn(BTN_UP, 40, true, false);
EasyButton downBtn(BTN_DOWN, 40, true, true);
EasyButton leftBtn(BTN_LEFT, 40, true, true);
EasyButton rightBtn(BTN_RIGHT, 40, true, false);
EasyButton cancelBtn(BTN_CANCEL, 40, true, true);
EasyButton acceptBtn(BTN_ACCEPT, 40, true, false);

Buttons get_pressed_button() {
  while (1) {
    upBtn.read();
    downBtn.read();
    leftBtn.read();
    rightBtn.read();
    cancelBtn.read();
    acceptBtn.read();

    if (upBtn.wasPressed())
      return BTN_UP;
    else if (downBtn.wasPressed())
      return BTN_DOWN;
    else if (leftBtn.wasPressed())
      return BTN_LEFT;
    else if (rightBtn.wasPressed())
      return BTN_RIGHT;
    else if (cancelBtn.wasPressed())
      return BTN_CANCEL;
    else if (acceptBtn.wasPressed())
      return BTN_ACCEPT;
  }
}

void draw_menu_itens(Menu *actualMenu) {
  lcd.clear();

  short itens = 0, actItem = 0, firstItem = 0, pssBtn = BTN_NONE;

  // Guarda a quantidade de itens do menu
  itens = actualMenu->MenuItens.size();
  Serial.printf("Quantidade de itens no menu: %d\n", itens);

  // Desenha o Titulo
  lcd.setCursor(0, 0);
  lcd.printf("Menu: %s", actualMenu->name.c_str());
  lcd.setCursor(0, 1);
  lcd.print("--------------------");

  do {
    // Limpa os espaços
    lcd.setCursor(0, 2);
    lcd.print("            ");
    lcd.setCursor(0, 3);
    lcd.print("            ");

    // Escreve o primeiro item
    lcd.setCursor(0, 2);
    lcd.print(actItem == 0 ? (char)lcd_setaDir : (char)lcd_pontoCentro);
    lcd.print(actualMenu->MenuItens.get(firstItem)->name.c_str());

    // Escreve o segundo item
    lcd.setCursor(0, 3);
    lcd.print(actItem == 1 ? (char)lcd_setaDir : (char)lcd_pontoCentro);
    lcd.print(actualMenu->MenuItens.get(firstItem + 1)->name.c_str());

    // Chama função para verificar botões
    pssBtn = get_pressed_button();

    switch (pssBtn) {
    case BTN_UP:
      if (actItem == 1)
        actItem--;
      else
        firstItem = firstItem == 0 ? firstItem : firstItem - 1;
      break;
,
    case BTN_DOWN:
      if (actItem == 0)
        actItem++;
      else
        firstItem = (firstItem + 1) == (itens - 1) ? firstItem : firstItem + 1;
      break;

    default:
      break;
    }

  } while (pssBtn != BTN_CANCEL);
}

void setup() {
  Serial.begin(9600);

  upBtn.begin();
  downBtn.begin();
  leftBtn.begin();
  rightBtn.begin();
  cancelBtn.begin();
  acceptBtn.begin();

  lcd.begin(20, 4);
  lcd.setBacklight(HIGH);

  lcd.clear();

  lcd.setCursor(1, 0);
  lcd.print("TT - LineFollower");

  lcd.setCursor(3, 1);
  lcd.print("Control Unit");

  lcd.setCursor(1, 3);
  lcd.print("V0.1 Raphera@2020");

  Menu mPrincipal("Inicio");

  Menu mDados("Dados");
  Menu mConfigs("Ajustes");
  Menu mInfo("Info");

  mPrincipal.MenuItens.add(&mDados);
  mPrincipal.MenuItens.add(&mConfigs);
  mPrincipal.MenuItens.add(&mInfo);

  draw_menu_itens(&mPrincipal);
}

void loop() {}