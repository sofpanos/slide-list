<template>
  <transition-group :tag="tag" class="osl-list-container" :style="cssVars" name="op-slide">
    <slot></slot>
  </transition-group>
</template>

<script>
import {getBCR, STATES} from '../helpers/util';

/**
 *
 * Browser Support (only for transition duration and timing of the children):
 *
 * - Chrome: >= 49 (<= 48: Experimental)
 * - Edge: 15
 * - Firefox: >= 31 (>= 29, < 59: config needed: layout.css.variables.enabled = true)
 * - Opera: >= 36
 * - Safari: >= 9.1
 * - IE: None
 *
 * [Mozilla Developer Network: var() browser support](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties#browser_compatibility)
 */
export default {
  name: "opap-slide-list",
  beforeMount() {
    this._endListener = event => {
      this.endListener(event);
    }
  },
  mounted() {
    this.$el.addEventListener('transitionend', this._endListener, {passive: true});
    if (this.state === STATES.ACTIVE) {
      this.stopTransition();
    }
    Object.assign(this, {
      $element: this.$el,
      property: 'height',
      beforeRect: {},
      state: STATES.INACTIVE,
      initialized: false
    });
    this.checkInitialHeight(this.$el);
  },
  destroyed() {
    this.$el.removeEventListener('transitionend', this._endListener, {passive: true})
  },
  beforeUpdate() {
    // The component $el can be null during mounted, if it's hidden by a falsy v-if
    // Duplicate event listeners are ignored, so it's safe to add this listener multiple times.
    this.$el.addEventListener('transitionend', this._endListener, {passive: true})
    this.checkInitialHeight(this.$el);

    // Retrieve component element on demand
    // It could have been hidden by v-if/v-show
    this.$element = this.$el;
    this.setBeforeValues();
  },
  updated() {
    this.$nextTick(() => {
      // Retrieve component element on demand
      // It could have been hidden by v-if/v-show
      this.$element = this.$el;
      this.reflow();
    });
  },
  methods: {
    /**
     * Check the initial height of the container in case of force-height = true.
     * This functions runs only one time, It is called multiple though because the container element may not be initialized.
     * It calculates the height that the container should have and sets it to that value, without transitioning.
     * @param $el The container element (this.$el).
     */
    checkInitialHeight($el) {
      if (!this.forceHeight || this.initialized || !$el) {
        return;
      }
      this.initialized = true;
      const children = $el.querySelectorAll('.osl-list-container > *');
      if (children.length !== this.visibleCount) {
        const height = this.calculateAfterHeight($el);
        $el.style.height = `${height}px`;
      }
    },
    /**
     * Updates the current state of the transition (this.state).
     * @param newState {string} the new state value either {@link STATES.ACTIVE} or {@link STATES.INACTIVE}
     */
    updateTransitionState(newState) {
      this.state = newState;
    },
    /**
     * The Transition end event listener is used to reset the state of the component when the transition ends.
     * @param event {TransitionEvent} The DOM event.
     */
    endListener(event) {
      const $targetEl = event.target
      // Transition on smooth element finished
      if (this.$element === $targetEl) {
        // The transition property is one that was registered
        if (this.property === event.propertyName) {
          this.stopTransition()
          if (!this.forceHeight) {
            setTimeout(() => {
              // Change prop back to auto
              this.$element.style[this.property] = null
            }, 0);
          }
        }
      }
    },
    /**
     * Remove inline overflow style, if overflow should be hidden. Set the current state to {@link STATES.INACTIVE}.
     */
    stopTransition() {
      if (this.hideOverflow) {
        // Clean up inline overflow
        this.$element.style.overflowX = null
        this.$element.style.overflowY = null
      }
      this.updateTransitionState(STATES.INACTIVE)
    },
    /**
     * Calculates the before BCR.
     * If a transition is currently active it is stopped and the height is set to the height of the BCR.
     */
    setBeforeValues() {
      this.beforeRect = {}

      if (!this.$element) {
        return
      }
      // getComputedStyle() can return null in iframe
      this.beforeRect = getBCR(this.$element)

      // Important to stopTransition after we've saved this.beforeRect
      if (this.state === STATES.ACTIVE) {

        // Set current height if the transition is active.
        this.$element.style.height = this.beforeRect.height;

        this.stopTransition()
      }
    },
    /**
     * Calculates the height that the container should have when only the selected number of children is shown ({@link #props.visibleCount}).
     * @param $el The Container element if null or undefined the current element is used ({@link $element})
     * @returns {number}
     */
    calculateAfterHeight($el) {
      const $element = $el || this.$element;
      const hiddenChildren = [];
      const $children = $element
          .querySelectorAll(`.osl-list-container > *:nth-child( n + ${this.visibleCount + 1} )`)
      // Hide children that will not be visible after the transition (by adding hidden class)
      $children.forEach(($child, index) => {
        if ($child.classList.contains('hidden')) {
          hiddenChildren.push(index);
          return;
        }
        $child.classList.add('hidden');
      });
      if ($element.style.height) {
        $element.style.height = null;
      }

      const afterRect = getBCR($element);
      // Revert hidden children css (by removing hidden class)
      $children.forEach(($child, index) => {
        if (hiddenChildren.indexOf(index) >= 0) {
          return;
        }
        $child.classList.remove('hidden');
      });
      return afterRect.height;
    },
    /**
     * Does the reflow needed in order to invoke the desired transition.
     */
    reflow() {
      if (!this.$element) {
        this.updateTransitionState(STATES.INACTIVE)
        return
      }
      // A transition is already occurring, don't interrupt it.
      if (this.state === STATES.ACTIVE) {
        return
      }

      this.updateTransitionState(STATES.ACTIVE)

      const afterHeight = this.calculateAfterHeight();

      if (!(Object.keys(this.beforeRect).length !== 0 && this.beforeRect[this.property] !== afterHeight)) {
        this.updateTransitionState(STATES.INACTIVE);
        return
      }

      if (this.hideOverflow) {
        this.$element.style.overflowX = 'hidden';
        this.$element.style.overflowY = 'hidden';
      }

      this.$element.style[this.property] = this.beforeRect[this.property] + 'px'

      this.$element.offsetHeight // Force reflow

      this.$element.style[this.property] = afterHeight + 'px'
    }
  },
  props: {
    /**
     * The number of the child elements that should be visible. In case of non forced height it's the number of child elements.
     */
    visibleCount: {
      type: Number,
      default: 1
    },
    /**
     * The container tag, is needed because the content is wrapped in transition group.
     */
    tag: {
      type: String,
      default: 'div'
    },
    /**
     * The transition duration
     */
    duration: {
      type: Number,
      default: 500
    },
    /**
     * The transition css timing function value.
     */
    timing: {
      type: String,
      default: 'ease-in-out'
    },
    /**
     * Flag indicating to ignore rendered elements and force height.
     * It's up to the user to enforce styling for correct UI results (e.g. overflow: hidden; when less children are visible).
     */
    forceHeight: {
      type: Boolean,
      default: false
    },
    /**
     * Flag indicating that overflow is hidden during transition.
     * Side effect: inline overflow style will be overridden after the first transition.
     */
    hideOverflow: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      $element: null,
      property: 'height',
      beforeRect: {},
      state: STATES.INACTIVE,
    };
  },
  computed: {
    cssVars() {
      return {
        '--transition-duration': `${this.duration != null ? this.duration : 500}ms`,
        '--transition-timing-function': this.timing || 'ease-out',
        'transition-duration': `${this.duration != null ? this.duration : 500}ms`,
        'transition-timing-function': `${this.duration != null ? this.duration : 500}ms`
      }
    }
  }
}
</script>

<style lang="scss">
.osl-list-container {
  transition-property: height;
  transition-duration: 500ms;
  transition-timing-function: ease-out;
  --transition-duration: 500ms; /* Default Values */
  --transition-timing-function: ease-out;

  .op-slide-enter {
    opacity: 1;
  }

  .op-slide-leave-active {
    transition: opacity var(--transition-duration) var(--transition-timing-function);
  }

  .op-slide-leave-to {
    opacity: 0;
  }

  // Check if can be replaced by tailwind utility.
  .hidden {
    display: none;
  }
}
</style>
