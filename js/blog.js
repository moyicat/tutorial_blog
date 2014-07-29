Parse.initialize("MuLlfET9KdSdwJ70aol03zHmu5bNTGprdu5jZpec", "NslqpkwkAsRP3gxw5pSlf8gw9PJhKqNW6UbikTK3");

var TestObject = Parse.Object.extend("TestObject");
var testObject = new TestObject();
testObject.save({foo: "bar"}).then(function(object) {
  alert("yay! it worked");
});