# emconfigure ./configure CFLAGS='-O3'
# emmake make

EMCC_OPTS=-O3 --llvm-lto 1 --memory-init-file 0 \
          -s NO_FILESYSTEM=1 \
          -s EXPORTED_FUNCTIONS="['_malloc']" \
          -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue', 'Runtime']" \
          -s ALLOW_MEMORY_GROWTH=1 \
          -s RESERVED_FUNCTION_POINTERS=1

SPEEXDSP_DIR=speexdsp-1.2rc3
SPEEXDSP_OBJ=$(SPEEXDSP_DIR)/libspeexdsp/.libs/libspeexdsp.a
SPEEXDSP_EXPORTS=\
 '_jitter_buffer_init',\
 '_jitter_buffer_reset',\
 '_jitter_buffer_destroy',\
 '_jitter_buffer_put',\
 '_jitter_buffer_get',\
 '_jitter_buffer_get_another',\
 '_jitter_buffer_get_pointer_timestamp',\
 '_jitter_buffer_tick',\
 '_jitter_buffer_ctl',\
 '_jitter_buffer_update_delay'

all:
	emcc -o libspeexdsp_jitter.js $(EMCC_OPTS) \
	     -s EXPORTED_FUNCTIONS="[$(SPEEXDSP_EXPORTS)]" \
	     $(SPEEXDSP_OBJ)
