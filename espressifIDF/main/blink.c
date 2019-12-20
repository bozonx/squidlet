/* Blink Example

   This example code is in the Public Domain (or CC0 licensed, at your option.)

   Unless required by applicable law or agreed to in writing, this
   software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
   CONDITIONS OF ANY KIND, either express or implied.
*/
#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "sdkconfig.h"

#include <string.h>
#include "mjs.c"

//#include "include/jerryscript.h"
//#include "include/jerryscript.h"
//#include "duk_config.h"
//#include "duktape.c"


/* Can use project configuration menu (idf.py menuconfig) to choose the GPIO to blink,
   or you can edit the following line and set a number here.
*/
// esp32 wroover-B 8mb ram led is pin 27
//#define BLINK_GPIO 27
// esp32 wroover-B 4mb ram led is pin 5
//#define BLINK_GPIO 5
// esp32 wroom-32 512kb ram led is pin 2
#define BLINK_GPIO 2

/*
static duk_ret_t native_print(duk_context *ctx) {
	duk_push_string(ctx, " ");
	duk_insert(ctx, 0);
	duk_join(ctx, duk_get_top(ctx) - 1);
	printf("%s\n", duk_safe_to_string(ctx, -1));
	return 0;
}

static duk_ret_t native_adder(duk_context *ctx) {
	int i;
	int n = duk_get_top(ctx); 
	double res = 0.0;

	for (i = 0; i < n; i++) {
		res += duk_to_number(ctx, i);
	}

	duk_push_number(ctx, res);
	return 1; 
}
*/


void foo(int x) {
  printf("Hello %d!\n", x);
}

void *my_dlsym(void *handle, const char *name) {
  if (strcmp(name, "foo") == 0) return foo;
  return NULL;
}


void app_main(void)
{

    struct mjs *mjs = mjs_create();
    mjs_set_ffi_resolver(mjs, my_dlsym);
    mjs_exec(mjs, "let f = ffi('void foo(int)'); f(1234)", NULL);

//    const jerry_char_t script[] = "var str = 'Hello, World!';";

//    jerry_run_simple(script, sizeof (script) - 1, JERRY_INIT_EMPTY);

    //printf(ret_value ? 0 : 1);

/*
	duk_context *ctx = duk_create_heap_default();

	duk_push_c_function(ctx, native_print, DUK_VARARGS);
	duk_put_global_string(ctx, "print");
	duk_push_c_function(ctx, native_adder, DUK_VARARGS);
	duk_put_global_string(ctx, "adder");

	duk_eval_string(ctx, "print('Hello world!');");

	duk_eval_string(ctx, "print('2+3=' + adder(2, 3));");
	duk_pop(ctx); 

	duk_destroy_heap(ctx);
*/
    //duk_context *ctx = duk_create_heap_default();
    //if (!ctx) { exit(1); }


	//duk_context *ctx = duk_create_heap_default();

	//duk_push_c_function(ctx, native_print, DUK_VARARGS);
	//duk_put_global_string(ctx, "print");
	//duk_pop(ctx);

    // duk_destroy_heap(ctx);


    /* Configure the IOMUX register for pad BLINK_GPIO (some pads are
       muxed to GPIO on reset already, but some default to other
       functions and need to be switched to GPIO. Consult the
       Technical Reference for a list of pads and their default
       functions.)
    */
    gpio_pad_select_gpio(BLINK_GPIO);
    /* Set the GPIO as a push/pull output */
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
