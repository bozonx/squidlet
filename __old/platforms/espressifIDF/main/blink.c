#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "sdkconfig.h"

#include <string.h>

//#include "quickjs.h"
//#include "quickjs.c"

#include "mjs.c"

// esp32 wroover-B 8mb ram led is pin 27
//#define BLINK_GPIO 27
// esp32 wroover-B 4mb ram led is pin 5
//#define BLINK_GPIO 5
// esp32 wroom-32 512kb ram led is pin 2
#define BLINK_GPIO 2


void foo(int x) {
  printf("Hello %d!\n", x);
}

void *my_dlsym(void *handle, const char *name) {
  if (strcmp(name, "foo") == 0) return foo;
  return NULL;
}


void app_main(void)
{
//    JSRuntime *rt;
//    JSContext *ctx;
//
//    const char *str = "print('111111')";
//
//    rt = JS_NewRuntime();
//    ctx = JS_NewContext(rt);
//
//    JS_Eval(ctx, str, strlen(str), "<input>", JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);

    struct mjs *mjs = mjs_create();
    mjs_set_ffi_resolver(mjs, my_dlsym);
    mjs_exec(mjs, "let f = ffi('void foo(int)'); f(1234)", NULL);

    gpio_pad_select_gpio(BLINK_GPIO);
    gpio_set_direction(BLINK_GPIO, GPIO_MODE_OUTPUT);

    while(1) {
        /* Blink off (output low) */
	      printf("Turning off the LED\n");
        gpio_set_level(BLINK_GPIO, 0);
        vTaskDelay(1000 / portTICK_PERIOD_MS);
        /* Blink on (output high) */
	      printf("Turning on the LED\n");
        gpio_set_level(BLINK_GPIO, 1);
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}
