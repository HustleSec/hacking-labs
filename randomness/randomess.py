from z3 import *

# Symbolic XorShift128+ function (from your provided code)
def sym_xs128p(slvr, state0, state1, observed, browser):
    s1 = state0 & 0xFFFFFFFFFFFFFFFF
    s0 = state1 & 0xFFFFFFFFFFFFFFFF
    s1 ^= (s1 << 23) & 0xFFFFFFFFFFFFFFFF
    s1 ^= (s1 >> 17) & 0xFFFFFFFFFFFFFFFF
    s1 ^= s0 & 0xFFFFFFFFFFFFFFFF
    s1 ^= (s0 >> 26) & 0xFFFFFFFFFFFFFFFF
    state0 = state1
    state1 = s1
    generated = (state0 + state1) & 0xFFFFFFFFFFFFFFFF
    slvr.add(generated & 0x1FFFFFFFFFFFFF == observed)
    return state0, state1, []

# Non-symbolic XorShift128+ to predict future values
def xs128p(state0, state1):
    s1 = state0 & 0xFFFFFFFFFFFFFFFF
    s0 = state1 & 0xFFFFFFFFFFFFFFFF
    s1 ^= (s1 << 23) & 0xFFFFFFFFFFFFFFFF
    s1 ^= (s1 >> 17) & 0xFFFFFFFFFFFFFFFF
    s1 ^= s0 & 0xFFFFFFFFFFFFFFFF
    s1 ^= (s0 >> 26) & 0xFFFFFFFFFFFFFFFF
    state0 = state1
    state1 = s1
    generated = (state0 + state1) & 0xFFFFFFFFFFFFFFFF
    # Scale to [0, 1) like Math.random()
    return state0, state1, generated / (2**53)

# Step 1: Recover the state using Z3
slvr = Solver()
sym_state0, sym_state1 = BitVecs('state0 state1', 64)
observed = [int(x * 2**53) for x in [0.9311600617849973, 0.3551442693830502, 0.7923158995678377]]
conditions = []
for ea in range(3):
    sym_state0, sym_state1, ret_conditions = sym_xs128p(slvr, sym_state0, sym_state1, observed[ea], 'v8')
    conditions += ret_conditions

# Check if a solution exists
if slvr.check() == sat:
    m = slvr.model()
    state0 = m[sym_state0].as_long()
    state1 = m[sym_state1].as_long()
    print(f"Recovered state: state0={state0}, state1={state1}")
else:
    print("No solution found")
    exit()

# Step 2: Predict the next 10 values
current_state0, current_state1 = state0, state1
next_values = []
for _ in range(10):
    current_state0, current_state1, value = xs128p(current_state0, current_state1)
    next_values.append(value)

# Print the predicted values
print("Next 10 predicted Math.random() values:")
for i, value in enumerate(next_values, 1):
    print(f"Value {i}: {value}")